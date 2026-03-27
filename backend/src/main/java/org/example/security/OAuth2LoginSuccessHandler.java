package org.example.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.model.Customer;
import org.example.model.Role;
import org.example.model.UserAccount;
import org.example.repository.CustomerRepository;
import org.example.repository.RoleRepository;
import org.example.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final UserAccountRepository userAccountRepo;
    private final CustomerRepository customerRepo;
    private final RoleRepository roleRepository;

    @Value("${app.frontend.origin:http://localhost:5173}")
    private String frontendOrigin;

    public OAuth2LoginSuccessHandler(JwtService jwtService,
                                     UserDetailsService userDetailsService,
                                     UserAccountRepository userAccountRepo,
                                     CustomerRepository customerRepo,
                                     RoleRepository roleRepository) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.userAccountRepo = userAccountRepo;
        this.customerRepo = customerRepo;
        this.roleRepository = roleRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException, ServletException {

        if (!(authentication instanceof OAuth2AuthenticationToken oauthTok)) {
            response.sendRedirect(frontendOrigin + "/login?oauthError=true");
            return;
        }

        OAuth2User oauthUser = oauthTok.getPrincipal();
        Map<String, Object> attrs = oauthUser.getAttributes();

        String picture = null;

// Google
        if (attrs.get("picture") instanceof String p && !p.isBlank()) {
            picture = p;
        }

// GitHub
        if ((picture == null || picture.isBlank())
                && attrs.get("avatar_url") instanceof String gh && !gh.isBlank()) {
            picture = gh;
        }

// Facebook nested picture.data.url
        if ((picture == null || picture.isBlank()) && attrs.get("picture") instanceof Map<?, ?> picMap) {
            Object dataObj = picMap.get("data");
            if (dataObj instanceof Map<?, ?> dataMap) {
                Object urlObj = dataMap.get("url");
                if (urlObj instanceof String fb && !fb.isBlank()) {
                    picture = fb;
                }
            }
        }

        String provider = oauthTok.getAuthorizedClientRegistrationId().toLowerCase();

        String externalId = firstNonBlank(
                str(attrs.get("sub")),    // Google
                str(attrs.get("id")),     // Facebook
                str(attrs.get("login"))   // GitHub
        );

        if (externalId == null || externalId.isBlank()) {
            response.sendRedirect(frontendOrigin + "/login?oauthError=true");
            return;
        }

        String username = (provider + ":" + externalId).toLowerCase();

        // ensure local UserAccount exists
        UserAccount ua = userAccountRepo.findByUsernameIgnoreCase(username).orElse(null);

        if (ua == null) {
            String rawEmail = firstNonBlank(
                    str(attrs.get("email")),
                    str(attrs.get("preferred_username")),
                    str(attrs.get("upn"))
            );
            String normalizedEmail = rawEmail != null ? rawEmail.trim().toLowerCase() : null;

            Customer customer = customerRepo
                    .findByExternalProviderAndExternalCustomerId(provider, externalId)
                    .orElse(null);

            if (customer == null) {
                String fullName = firstNonBlank(str(attrs.get("name")), str(attrs.get("login")));

                String firstName = firstNonBlank(
                        str(attrs.get("given_name")),
                        str(attrs.get("first_name")),
                        (fullName != null ? fullName.split(" ")[0] : null),
                        "—"
                );

                String lastName = firstNonBlank(
                        str(attrs.get("family_name")),
                        str(attrs.get("last_name")),
                        (fullName != null ? fullName.replaceFirst("^\\S+\\s*", "") : null),
                        ""
                );

                Customer c = new Customer();
                c.setCustomerType("Individual");
                c.setFirstName(firstName);
                c.setLastName(lastName);
                c.setEmail(normalizedEmail);
                c.setHomePhone(null);
                c.setExternalProvider(provider);
                c.setExternalCustomerId(externalId);
                c.setStatus("Active");
                c.setCreatedAt(LocalDateTime.now());
                c.setPasswordHash("OAUTH:" + provider);
                customer = customerRepo.save(c);
            }

            UserAccount newUa = new UserAccount();
            newUa.setUsername(username);
            //newUa.setRole("CUSTOMER");
            Role customerRole = roleRepository.findByRoleName("Customer")
                    .orElseThrow(() -> new RuntimeException("Customer role not found"));

            newUa.setRole(customerRole);
            newUa.setCustomerId(customer.getCustomerId());
            newUa.setEmployeeId(null);
            newUa.setIsLocked(0);
            newUa.setPasswordHash("OAUTH:" + provider);
            newUa.setLastLoginAt(LocalDateTime.now());
            newUa.setAvatarUrl(picture);

            ua = userAccountRepo.save(newUa);
        } else {
            ua.setLastLoginAt(LocalDateTime.now());
            if ((ua.getAvatarUrl() == null || ua.getAvatarUrl().isBlank())
                    && picture != null && !picture.isBlank()) {
                ua.setAvatarUrl(picture);
            }
            userAccountRepo.save(ua);
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        String token = jwtService.generateToken(userDetails);

        String redirectUrl = frontendOrigin + "/oauth-success?token=" +
                URLEncoder.encode(token, StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
    }

    private static String str(Object o) {
        return o == null ? null : o.toString().trim();
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.trim().isEmpty()) return v.trim();
        }
        return null;
    }
}