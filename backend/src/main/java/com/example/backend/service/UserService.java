package com.example.backend.service;

import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getTechnicians() {
        return userRepository.findByRole(Role.TECHNICIAN);
    }

    public User getById(Long id) {
        return userRepository
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
    }
}
