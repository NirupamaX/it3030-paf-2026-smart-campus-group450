package com.example.backend.dto;

import com.example.backend.model.IncidentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class IncidentUpdateRequest {

    @NotNull
    private IncidentStatus status;

    private String resolutionNote;

    private String rejectionReason;
}
