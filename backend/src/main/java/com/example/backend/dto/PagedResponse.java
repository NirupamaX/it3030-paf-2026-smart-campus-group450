package com.example.backend.dto;

import java.util.List;
import java.util.Map;

public record PagedResponse(
    List<Map<String, Object>> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean last
) {
    public static PagedResponse of(
        List<Map<String, Object>> content,
        int page,
        int size,
        long totalElements
    ) {
        int totalPages = size == 0 ? 1 : (int) Math.ceil((double) totalElements / size);
        return new PagedResponse(content, page, size, totalElements, totalPages, page >= totalPages - 1);
    }
}
