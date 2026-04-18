package com.example.backend.controller;

import com.example.backend.dto.AuthResponse;
import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.dto.ViewMapper;
import com.example.backend.security.JwtCookieUtil;
import com.example.backend.service.AuthService;
import com.example.backend.service.CurrentUserService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final CurrentUserService currentUserService;
    private final JwtCookieUtil jwtCookieUtil;

    public AuthController(
        AuthService authService,
        CurrentUserService currentUserService,
        JwtCookieUtil jwtCookieUtil
    ) {
        this.authService = authService;
        this.currentUserService = currentUserService;
        this.jwtCookieUtil = jwtCookieUtil;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.register(request);
        jwtCookieUtil.addJwtToCookie(response, authResponse.getToken());
        return authResponse;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        jwtCookieUtil.addJwtToCookie(response, authResponse.getToken());
        return authResponse;
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpServletResponse response) {
        jwtCookieUtil.removeJwtCookie(response);
        return Map.of("message", "Logged out successfully");
    }

    @GetMapping("/me")
    public Map<String, Object> me() {
        return ViewMapper.user(currentUserService.getCurrentUser());
    }
}
