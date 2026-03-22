package com.example.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class IncidentAssignRequest {

    @NotNull
    private Long technicianId;
}
