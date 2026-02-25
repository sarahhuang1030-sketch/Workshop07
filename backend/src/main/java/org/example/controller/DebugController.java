package org.example.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class DebugController {

    @GetMapping("/api/debug/whoami")
    public Map<String, Object> whoami(Authentication auth, HttpServletRequest req) {
        return Map.of(
                "authenticated", auth != null && auth.isAuthenticated(),
                "authType", auth == null ? null : auth.getClass().getName(),
                "name", auth == null ? null : auth.getName(),
                "sessionId", req.getSession(false) == null ? null : req.getSession(false).getId()
        );
    }

    @PostMapping("/api/debug/check")
    public Map<String, Object> check(Authentication auth, HttpServletRequest req) {
        return Map.of(
                "method", req.getMethod(),
                "path", req.getRequestURI(),
                "authenticated", auth != null && auth.isAuthenticated(),
                "authType", auth == null ? null : auth.getClass().getName(),
                "name", auth == null ? null : auth.getName(),
                "sessionId", req.getSession(false) == null ? null : req.getSession(false).getId()
        );
    }
}