package com.example.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Logs mutating API calls (POST/PUT/PATCH/DELETE) with the authenticated user,
 * HTTP method, URI, and response status for audit purposes.
 */
@Component
public class AuditLogInterceptor implements HandlerInterceptor {

    private static final Logger audit = LoggerFactory.getLogger("AUDIT");

    @Override
    public void afterCompletion(
        HttpServletRequest request,
        HttpServletResponse response,
        Object handler,
        Exception ex
    ) {
        String method = request.getMethod();
        if (!isMutating(method)) return;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String principal = (auth != null && auth.isAuthenticated()) ? auth.getName() : "anonymous";
        String ip = resolveIp(request);

        audit.info("[AUDIT] {} {} {} | user={} ip={} status={}",
            method, request.getRequestURI(),
            request.getQueryString() != null ? "?" + request.getQueryString() : "",
            principal, ip, response.getStatus());
    }

    private boolean isMutating(String method) {
        return "POST".equals(method) || "PUT".equals(method)
            || "PATCH".equals(method) || "DELETE".equals(method);
    }

    private String resolveIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
