package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BookingDecisionRequest {

    @NotBlank
    private String decision;

    private String comment;
}
