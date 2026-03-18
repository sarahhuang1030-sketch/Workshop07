/**
 Description: This class configures the security settings for the application using Spring Security.
 It defines how authentication and authorization are handled.
 Created by: Sarah
 Created on: February 2026
 **/

package org.example.config;

import org.example.repository.UserAccountRepository;
import org.example.security.OAuth2LoginSuccessHandler;
import org.example.service.CustomOAuth2UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
//import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.DelegatingAuthenticationEntryPoint;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.example.security.JwtAuthenticationFilter;
import java.util.LinkedHashMap;

import static org.springframework.security.config.Customizer.withDefaults;

//this is just to test the backend on azure
@Profile("!azuretest")
@EnableWebSecurity
@Configuration
public class SecurityConfig {

    @Value("${app.frontend.origin:http://localhost:5173}")
    private String frontendOrigin;

    //hash password
//    @Bean
//    public PasswordEncoder passwordEncoder() {
//        return new BCryptPasswordEncoder();
//    }



    //raw password
    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           DaoAuthenticationProvider provider,
                                           CustomOAuth2UserService customOAuth2UserService,
                                           JwtAuthenticationFilter jwtAuthenticationFilter,
                                           OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler) throws Exception {

        RequestMatcher apiMatcher = new AntPathRequestMatcher("/api/**");
        LinkedHashMap<RequestMatcher, org.springframework.security.web.AuthenticationEntryPoint> entryPoints = new LinkedHashMap<>();
        entryPoints.put(apiMatcher, (req, res, ex) -> res.sendError(401, "Unauthorized"));

        DelegatingAuthenticationEntryPoint delegatingEntryPoint =
                new DelegatingAuthenticationEntryPoint(entryPoints);
        delegatingEntryPoint.setDefaultEntryPoint(new LoginUrlAuthenticationEntryPoint(frontendOrigin + "/login"));

        http
                .csrf(csrf -> csrf.disable())
                .cors(withDefaults())
                .httpBasic(b -> b.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authenticationProvider(provider)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(delegatingEntryPoint)
                        .accessDeniedHandler((req, res, e) -> res.sendError(403, "Forbidden"))
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/error",
                                "/",
                                "/public/**",
                                "/oauth2/**",
//                                "/api/billing/payment/**",
                                "/api/auth/login",
                                "/api/auth/logout",
                                "/api/auth/register",
                                "/api/auth/forgetpassword",
                                "/api/auth/resetpassword",
                                "/api/plans/**",
                                "/api/addons/**",
                                "/api/weather",
                                "/uploads/**",
                                "/login/**"
                        ).permitAll()
                        // REQUIRE LOGIN
                        .requestMatchers("/api/billing/payment/**").authenticated()
                        // Role-based
                        .requestMatchers("/api/manager/**").hasRole("MANAGER")
                        .requestMatchers("/api/sales/**").hasAnyRole("SALES_AGENT", "MANAGER")
                        .requestMatchers("/api/service/**").hasAnyRole("SERVICE_TECHNICIAN", "MANAGER")
                        // All other APIs require authentication
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )
                .oauth2Login(o -> o
                        .userInfoEndpoint(u -> u.userService(customOAuth2UserService))
                        .successHandler(oAuth2LoginSuccessHandler)
                        .failureHandler((request, response, exception) ->
                                response.sendRedirect(frontendOrigin + "/login?oauthError=true"))
                )
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler((req, res, auth) -> res.setStatus(200))
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                );

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService(UserAccountRepository repo) {
        return username -> repo.findByUsernameIgnoreCase(username)
                .map(u -> {
                    String dbRole = (u.getRole() == null || u.getRole().isBlank()) ? "Customer" : u.getRole();
                    String roleKey = dbRole.trim().toUpperCase().replace(' ', '_'); // "Sales Agent" -> "SALES_AGENT"
                    return User.withUsername(u.getUsername())
                            .password(u.getPasswordHash())
                            .authorities("ROLE_" + roleKey)
                            .build();
                })
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(UserDetailsService uds,
                                                            PasswordEncoder encoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(uds);
        provider.setPasswordEncoder(encoder);
        return provider;
    }
}