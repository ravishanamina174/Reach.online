package com.reachonline.backend.release.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateReleaseReviewRequest(

        @NotBlank
        @Size(max = 160)
        String contractName,

        @NotBlank
        @Size(max = 80)
        String fromVersion,

        @NotBlank
        @Size(max = 80)
        String proposedVersion
) {
}