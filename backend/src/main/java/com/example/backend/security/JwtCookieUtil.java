package com.example.backend.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtCookieUtil {

    private static final String JWT_COOKIE_NAME = "authToken";

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    @Value("${app.jwt.cookie.secure:false}")
    private boolean cookieSecure;

    public void addJwtToCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(JWT_COOKIE_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure); // true for HTTPS in production
        cookie.setPath("/");
        cookie.setMaxAge((int) (jwtExpirationMs / 1000));
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }

    public String getJwtFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (JWT_COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    public void removeJwtCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(JWT_COOKIE_NAME, null);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}
