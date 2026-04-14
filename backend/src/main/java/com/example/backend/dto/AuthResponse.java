package com.example.backend.dto;

import com.example.backend.model.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private Long userId;
    private String fullName;
    private String email;
    private Role role;
}
