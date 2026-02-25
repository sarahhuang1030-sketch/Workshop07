package org.example.service;

import org.springframework.http.*;
import org.springframework.security.oauth2.client.userinfo.*;
import org.springframework.security.oauth2.client.*;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.core.user.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final RestTemplate rest = new RestTemplate();

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User user = super.loadUser(userRequest);

        String regId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attrs = new LinkedHashMap<>(user.getAttributes());

        // If GitHub, ensure we have an email (GitHub /user often returns null email)
        if ("github".equalsIgnoreCase(regId)) {
            Object email = attrs.get("email");
            if (email == null || String.valueOf(email).isBlank()) {
                String token = userRequest.getAccessToken().getTokenValue();
                String bestEmail = fetchGithubPrimaryVerifiedEmail(token);
                if (bestEmail != null && !bestEmail.isBlank()) {
                    attrs.put("email", bestEmail);
                }
            }
        }

        // keep authorities + name attribute
        String nameAttr = userRequest.getClientRegistration()
                .getProviderDetails()
                .getUserInfoEndpoint()
                .getUserNameAttributeName();

        return new DefaultOAuth2User(user.getAuthorities(), attrs, nameAttr);
    }

    private String fetchGithubPrimaryVerifiedEmail(String token) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            HttpEntity<Void> req = new HttpEntity<>(headers);

            ResponseEntity<List> resp = rest.exchange(
                    "https://api.github.com/user/emails",
                    HttpMethod.GET,
                    req,
                    List.class
            );

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) return null;

            // Each item: { email, primary, verified, visibility }
            List<Map<String, Object>> emails = (List<Map<String, Object>>) (List<?>) resp.getBody();

            // Prefer primary + verified
            for (Map<String, Object> e : emails) {
                if (Boolean.TRUE.equals(e.get("primary")) && Boolean.TRUE.equals(e.get("verified"))) {
                    Object v = e.get("email");
                    return v == null ? null : v.toString().trim().toLowerCase();
                }
            }

            // Otherwise first verified
            for (Map<String, Object> e : emails) {
                if (Boolean.TRUE.equals(e.get("verified"))) {
                    Object v = e.get("email");
                    return v == null ? null : v.toString().trim().toLowerCase();
                }
            }

            return null;
        } catch (Exception ex) {
            return null;
        }
    }
}
