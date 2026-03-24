package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BookingDecisionRequest {

    @NotBlank
    @JsonAlias("decision")
    private String status;

    @JsonAlias("comment")
    private String rejectionReason;
}
