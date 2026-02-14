package org.example.config;

import org.example.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import java.util.LinkedHashMap;
import org.springframework.security.config.http.SessionCreationPolicy;


import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.DelegatingAuthenticationEntryPoint;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;


@EnableWebSecurity
@Configuration
public class SecurityConfig {


    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           DaoAuthenticationProvider provider) throws Exception {

        RequestMatcher apiMatcher = new AntPathRequestMatcher("/api/**");

        LinkedHashMap<RequestMatcher, AuthenticationEntryPoint> entryPoints = new LinkedHashMap<>();
        entryPoints.put(apiMatcher, (req, res, ex) -> res.sendError(401, "Unauthorized"));

        DelegatingAuthenticationEntryPoint delegatingEntryPoint =
                new DelegatingAuthenticationEntryPoint(entryPoints);
        delegatingEntryPoint.setDefaultEntryPoint((req, res, ex) -> res.sendError(401, "Unauthorized"));

        http
                .csrf(csrf -> csrf.disable())
                .cors(c -> {})
                .httpBasic(b -> b.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
              //  .formLogin(f -> f.disable())
                .authenticationProvider(provider)     // ✅ force your DAO provider to be used
                .exceptionHandling(ex -> ex.authenticationEntryPoint(delegatingEntryPoint))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/error",
                                "/",
                                "/public/**",
                                "/oauth2/**",
                                "/login/**",
                                "/logout",
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/plans/**",
                                "/api/addons/**",
                                "/api/auth/forgetpassword",
                                "/api/auth/resetpassword"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth.defaultSuccessUrl(frontendBaseUrl + "/oauth-success", true))
                .logout(logout -> logout.logoutSuccessUrl(frontendBaseUrl + "/").permitAll());

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService(UserAccountRepository repo) {
        return username -> repo.findByUsernameIgnoreCase(username)
                .map(u -> User.withUsername(u.getUsername())
                        .password(u.getPasswordHash())   // must be BCrypt hash
                        .roles(u.getRole())              // or authorities(...)
                        .build())
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
