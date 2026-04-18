package com.example.backend.controller;

import com.example.backend.dto.ViewMapper;
import com.example.backend.service.UserService;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/users")
    public List<Map<String, Object>> users() {
        return userService.getAllUsers().stream().map(ViewMapper::user).toList();
    }

    @GetMapping("/technicians")
    public List<Map<String, Object>> technicians() {
        return userService.getTechnicians().stream().map(ViewMapper::user).toList();
    }
}
