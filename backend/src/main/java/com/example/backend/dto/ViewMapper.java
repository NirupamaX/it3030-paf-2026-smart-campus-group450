package com.example.backend.dto;

import com.example.backend.model.Booking;
import com.example.backend.model.Facility;
import com.example.backend.model.IncidentAttachment;
import com.example.backend.model.IncidentTicket;
import com.example.backend.model.Notification;
import com.example.backend.model.TicketComment;
import com.example.backend.model.User;
import java.util.HashMap;
import java.util.Map;

public final class ViewMapper {

    private ViewMapper() {}

    public static Map<String, Object> user(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("fullName", user.getFullName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole());
        map.put("active", user.isActive());
        map.put("createdAt", user.getCreatedAt());
        return map;
    }

    public static Map<String, Object> facility(Facility facility) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", facility.getId());
        map.put("name", facility.getName());
        map.put("type", facility.getType());
        map.put("location", facility.getLocation());
        map.put("capacity", facility.getCapacity());
        map.put("description", facility.getDescription());
        map.put("available", facility.isAvailable());
        map.put("status", facility.getStatus());
        map.put("openingTime", facility.getOpeningTime());
        map.put("closingTime", facility.getClosingTime());
        return map;
    }

    public static Map<String, Object> booking(Booking booking) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", booking.getId());
        map.put("resourceId", booking.getFacility().getId());
        map.put("userId", booking.getUser().getId());
        map.put("bookingDate", booking.getBookingDate());
        map.put("startTime", booking.getStartTime());
        map.put("endTime", booking.getEndTime());
        map.put("purpose", booking.getPurpose());
        map.put("attendees", booking.getAttendees());
        map.put("status", booking.getStatus());
        map.put("rejectionReason", booking.getRejectionReason());

        // Compatibility keys used by existing frontend screens.
        map.put("facility", facility(booking.getFacility()));
        map.put("user", user(booking.getUser()));
        map.put("expectedAttendees", booking.getAttendees());
        map.put("decisionComment", booking.getRejectionReason());
        map.put("createdAt", booking.getCreatedAt());
        return map;
    }

    public static Map<String, Object> incident(IncidentTicket ticket) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", ticket.getId());
        map.put("title", ticket.getTitle());
        map.put("description", ticket.getDescription());
        map.put("location", ticket.getLocation());
        map.put("category", ticket.getCategory());
        map.put("priority", ticket.getPriority());
        map.put("status", ticket.getStatus());
        map.put("reporter", user(ticket.getReporter()));
        map.put("technician", ticket.getTechnician() != null ? user(ticket.getTechnician()) : null);
        map.put("preferredContact", ticket.getPreferredContact());
        map.put("resolutionNote", ticket.getResolutionNote());
        map.put("rejectionReason", ticket.getRejectionReason());
        map.put("imageUrl", ticket.getImageUrl());
        map.put("createdAt", ticket.getCreatedAt());
        map.put("updatedAt", ticket.getUpdatedAt());
        return map;
    }

    public static Map<String, Object> incidentAttachment(IncidentAttachment attachment) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", attachment.getId());
        map.put("incidentId", attachment.getIncident().getId());
        map.put("fileUrl", attachment.getFileUrl());
        map.put("createdAt", attachment.getCreatedAt());
        return map;
    }

    public static Map<String, Object> ticketComment(TicketComment comment) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", comment.getId());
        map.put("incidentId", comment.getIncident().getId());
        map.put("author", user(comment.getAuthor()));
        map.put("content", comment.getContent());
        map.put("createdAt", comment.getCreatedAt());
        map.put("updatedAt", comment.getUpdatedAt());
        return map;
    }

    public static Map<String, Object> notification(Notification notification) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", notification.getId());
        map.put("type", notification.getType());
        map.put("message", notification.getMessage());
        map.put("isRead", notification.isRead());
        map.put("createdAt", notification.getCreatedAt());
        return map;
    }
}
