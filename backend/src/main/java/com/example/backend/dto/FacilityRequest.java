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

    @NotBlank
    private String name;

    @NotBlank
    private String type;

    @NotBlank
    private String location;

    @NotNull
    @Min(1)
    private Integer capacity;

    private String description;

    @NotNull
    private Boolean available;

    @NotNull
    private ResourceStatus status;

    @NotBlank
    private String operatingHours;

    @NotBlank
    private String openingTime;

    @NotBlank
    private String closingTime;
}

