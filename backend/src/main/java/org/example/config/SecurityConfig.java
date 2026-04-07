/**
 * Description: Spring Security configuration for authentication and authorization.
 * Handles JWT authentication, OAuth2 login, and role-based API access control.
 * Created by: Sarah
 * Created on: February 2026
 */

package org.example.config;

import org.example.repository.UserAccountRepository;
import org.example.security.JwtAuthenticationFilter;
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
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.DelegatingAuthenticationEntryPoint;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

import java.util.LinkedHashMap;

import static org.springframework.security.config.Customizer.withDefaults;

@Profile("!azuretest")
@EnableWebSecurity
@Configuration
public class SecurityConfig {

    @Value("${app.frontend.origin:http://localhost:5173}")
    private String frontendOrigin;

    /**
     * Password encoder (NOT secure, used for testing only)
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }

    /**
     * Authentication manager
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Main security filter chain
     */
    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            DaoAuthenticationProvider provider,
            CustomOAuth2UserService customOAuth2UserService,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler
    ) throws Exception {

        // Entry point for API authentication failure
        RequestMatcher apiMatcher = new AntPathRequestMatcher("/api/**");
        LinkedHashMap<RequestMatcher, org.springframework.security.web.AuthenticationEntryPoint> entryPoints = new LinkedHashMap<>();
        entryPoints.put(apiMatcher, (req, res, ex) -> res.sendError(401, "Unauthorized"));

        DelegatingAuthenticationEntryPoint delegatingEntryPoint =
                new DelegatingAuthenticationEntryPoint(entryPoints);

        delegatingEntryPoint.setDefaultEntryPoint(
                new LoginUrlAuthenticationEntryPoint(frontendOrigin + "/login")
        );

        http
                // Disable CSRF for REST APIs
                .csrf(csrf -> csrf.disable())

                // Enable CORS
                .cors(withDefaults())

                // Disable HTTP Basic auth
                .httpBasic(b -> b.disable())

                // Stateless session (JWT-based)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Authentication provider
                .authenticationProvider(provider)

                // JWT filter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                // Exception handling
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(delegatingEntryPoint)
                        .accessDeniedHandler((req, res, e) -> res.sendError(403, "Forbidden"))
                )

                // Authorization rules
                .authorizeHttpRequests(auth -> auth

                        // Public endpoints
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/",
                                "/error",
                                "/public/**",
                                "/oauth2/**",
                                "/api/auth/**",
                                "/api/plans/**",
                                "/api/addons/**",
                                "/api/weather",
                                "/uploads/**",
                                "/login/**",
                                "/api/chat/**"
                        ).permitAll()

                        // Billing requires login
                        .requestMatchers("/api/billing/payment/**").authenticated()

                        /**
                         * ROLE-BASED ACCESS CONTROL (FIXED)
                         */

                        // Manager dashboard (FIXED: allow MANAGER + AGENT if needed)
                        .requestMatchers("/api/manager/**")
                        .hasAnyRole("MANAGER", "SALES_AGENT")


                        // Agent APIs
                        .requestMatchers("/api/agent/**")
                        .hasRole("SALES_AGENT")

                        // Service APIs
                        .requestMatchers("/api/service/**")
                        .hasAnyRole("SERVICE_TECHNICIAN", "MANAGER", "SALES_AGENT")

                        // All APIs require authentication
                        .requestMatchers("/api/**").authenticated()

                        .anyRequest().permitAll()
                )

                // OAuth2 login
                .oauth2Login(o -> o
                        .userInfoEndpoint(u -> u.userService(customOAuth2UserService))
                        .successHandler(oAuth2LoginSuccessHandler)
                        .failureHandler((request, response, exception) ->
                                response.sendRedirect(frontendOrigin + "/login?oauthError=true"))
                )

                // Logout
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler((req, res, auth) -> res.setStatus(200))
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                );

        return http.build();
    }

    /**
     * UserDetailsService - maps DB role → Spring Security role
     */
//    @Bean
//    public UserDetailsService userDetailsService(UserAccountRepository repo) {
//        return username -> repo.findByUsernameIgnoreCase(username)
//                .map(u -> {
//
//                    String dbRole = (u.getRole() == null
//                            || u.getRole().getRoleName() == null
//                            || u.getRole().getRoleName().isBlank())
//                            ? "CUSTOMER"
//                            : u.getRole().getRoleName();
//
//                    // Normalize role
//                    String roleKey = dbRole.trim().toUpperCase().replace(" ", "_");
//
//                    return User.withUsername(u.getUsername())
//                            .password(u.getPasswordHash())
//                            .authorities("ROLE_" + roleKey)
//                            .build();
//                })
//                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
//    }

    @Bean
    public UserDetailsService userDetailsService(UserAccountRepository repo) {
        return username -> repo.findByUsernameIgnoreCase(username)
                .map(u -> {

                    // Normalize DB role (no ROLE_ assumption here)
                    String dbRole = (u.getRole() == null || u.getRole().getRoleName() == null)
                            ? "CUSTOMER"
                            : u.getRole().getRoleName();

                    String roleKey = dbRole.trim()
                            .toUpperCase()
                            .replace(" ", "_");

                    // IMPORTANT: Spring Security requires ROLE_ prefix
                    return User.withUsername(u.getUsername())
                            .password(u.getPasswordHash())
                            .authorities("ROLE_" + roleKey)
                            .build();
                })
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    /**
     * Authentication provider
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider(
            UserDetailsService uds,
            PasswordEncoder encoder
    ) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(uds);
        provider.setPasswordEncoder(encoder);
        return provider;
    }
}