
package com.reachonline.backend.registry.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDependencyRequest(
        @NotBlank
        @Size(max = 120)
        String agentName,

        @NotBlank
        @Size(max = 120)
        String toolName,

        @NotBlank
        @Size(max = 5000)
        String consumerExpectations
) {
}
