package com.example.backend.dto;

import com.example.backend.model.ResourceStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FacilityRequest {

    @NotBlank(message = "Facility name is required")
    private String name;

    @NotBlank(message = "Facility type is required")
    private String type;

    @NotBlank(message = "Facility location is required")
    private String location;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be greater than 0")
    private Integer capacity;

    private String description;

    @NotNull(message = "Availability is required")
    private Boolean available;

    @NotNull(message = "Status is required")
    private ResourceStatus status;

    private String operatingHours;

    @NotBlank(message = "Opening time is required")
    private String openingTime;

    @NotBlank(message = "Closing time is required")
    private String closingTime;
}