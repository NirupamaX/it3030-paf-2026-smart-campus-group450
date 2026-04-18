package com.example.backend.dto;

import com.example.backend.model.ResourceStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FacilityRequest {

    @NotBlank(message = "Facility name is required")
    @Size(min = 2, max = 100, message = "Facility name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Facility type is required")
    @Size(max = 50, message = "Facility type must not exceed 50 characters")
    private String type;

    @NotBlank(message = "Location is required")
    @Size(min = 2, max = 200, message = "Location must be between 2 and 200 characters")
    private String location;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Max(value = 10000, message = "Capacity must not exceed 10000")
    private Integer capacity;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @NotNull(message = "Availability status is required")
    private Boolean available;

    @NotNull(message = "Resource status is required")
    private ResourceStatus status;

    @NotBlank(message = "Operating hours are required")
    @Pattern(
        regexp = "^\\d{2}:\\d{2}-\\d{2}:\\d{2}$",
        message = "Operating hours must be in format HH:MM-HH:MM"
    )
    private String operatingHours;

    @NotBlank(message = "Opening time is required")
    @Pattern(
        regexp = "^\\d{2}:\\d{2}$",
        message = "Opening time must be in format HH:MM"
    )
    private String openingTime;

    @NotBlank(message = "Closing time is required")
    @Pattern(
        regexp = "^\\d{2}:\\d{2}$",
        message = "Closing time must be in format HH:MM"
    )
    private String closingTime;
}
