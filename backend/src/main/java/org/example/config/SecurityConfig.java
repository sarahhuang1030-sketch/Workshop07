package org.example.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

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
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(c -> {}) // enable CORS
                .formLogin(form -> form.disable()) // stop Spring HTML login page
                .httpBasic(httpBasic -> httpBasic.disable())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                response.sendError(401, "Unauthorized")
                        )
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/error",
                                "/",
                                "/public/**",
                                "/oauth2/**",
                                "/login/**",
                                // allow register/login only
                                "/api/auth/login",
                                "/api/auth/register",
                                // public data endpoints
                                "/api/plans/**",
                                "/api/addons/**",
                                //password related
                                "/api/auth/forgetpassword",
                                "/api/auth/resetpassword"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                        // redirect back to frontend after login
                        .defaultSuccessUrl(frontendBaseUrl + "/oauth-success", true)
                )
                .logout(logout -> logout
                        .logoutSuccessUrl(frontendBaseUrl + "/")
                        .permitAll()
                );

        return http.build();
    }


}
