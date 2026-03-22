package com.example.backend.controller;

import com.example.backend.dto.ViewMapper;
import com.example.backend.service.CurrentUserService;
import com.example.backend.service.NotificationService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    public NotificationController(
        NotificationService notificationService,
        CurrentUserService currentUserService
    ) {
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        Long userId = currentUserService.getCurrentUser().getId();
        return notificationService.getUserNotifications(userId).stream().map(ViewMapper::notification).toList();
    }

    @GetMapping("/unread-count")
    public Map<String, Object> unreadCount() {
        Long userId = currentUserService.getCurrentUser().getId();
        return Map.of("unread", notificationService.getUnreadCount(userId));
    }

    @PatchMapping("/{id}/read")
    public Map<String, Object> read(@PathVariable Long id) {
        Long userId = currentUserService.getCurrentUser().getId();
        return ViewMapper.notification(notificationService.markAsRead(id, userId));
    }
}
