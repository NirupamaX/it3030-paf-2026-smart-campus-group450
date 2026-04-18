package com.example.backend.controller;

import com.example.backend.dto.AuthResponse;
import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.OtpRequest;
import com.example.backend.dto.OtpVerifyRequest;
import com.example.backend.dto.RegisterRequest;
import com.example.backend.dto.ViewMapper;
import com.example.backend.service.AuthService;
import com.example.backend.service.CurrentUserService;
import com.example.backend.service.OtpService;
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
    private final OtpService otpService;

    public AuthController(AuthService authService, CurrentUserService currentUserService, OtpService otpService) {
        this.authService = authService;
        this.currentUserService = currentUserService;
        this.otpService = otpService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/send-otp")
    public Map<String, String> sendOtp(@Valid @RequestBody OtpRequest request) {
        otpService.sendOtp(request.getEmail());
        return Map.of("message", "OTP sent to " + request.getEmail());
    }

    @PostMapping("/verify-otp")
    public Map<String, Boolean> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        otpService.verifyOtp(request.getEmail(), request.getOtp());
        return Map.of("verified", true);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public Map<String, Object> me() {
        return ViewMapper.user(currentUserService.getCurrentUser());
    }
}
