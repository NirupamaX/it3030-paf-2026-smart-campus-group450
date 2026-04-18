package com.example.backend.dto;

import com.example.backend.model.IncidentCategory;
import com.example.backend.model.IncidentPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class IncidentCreateRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotBlank
    private String location;

    @NotNull
    private IncidentCategory category;

    @NotNull
    private IncidentPriority priority;

    private String preferredContact;

    // Backward-compatible single-image field used by the current frontend.
    private String imageUrl;

    @Size(max = 3)
    private List<@NotBlank String> imageUrls;
}
