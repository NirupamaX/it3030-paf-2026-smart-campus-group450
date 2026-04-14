package com.example.backend.config;

import com.example.backend.model.Role;
import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedDefaultUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.existsByEmail("admin@campusx.com")) {
                User admin = new User();
                admin.setFullName("CampusX Admin");
                admin.setEmail("admin@campusx.com");
                admin.setPassword(passwordEncoder.encode("Admin@123"));
                admin.setRole(Role.ADMIN);
                admin.setActive(true);
                userRepository.save(admin);
            }

            if (!userRepository.existsByEmail("tech@campusx.com")) {
                User tech = new User();
                tech.setFullName("Campus Technician");
                tech.setEmail("tech@campusx.com");
                tech.setPassword(passwordEncoder.encode("Tech@123"));
                tech.setRole(Role.TECHNICIAN);
                tech.setActive(true);
                userRepository.save(tech);
            }
        };
    }
}
