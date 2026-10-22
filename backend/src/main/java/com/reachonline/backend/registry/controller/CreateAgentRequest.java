package com.reachonline.backend.registry.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAgentRequest(
        @NotBlank
        @Size(max = 120)
        String name,

        @Size(max = 1000)
        String description,

        @NotBlank
        @Size(max = 50)
        String agentType
) {}