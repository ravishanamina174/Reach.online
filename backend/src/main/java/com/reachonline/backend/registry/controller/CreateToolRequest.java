package com.reachonline.backend.registry.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateToolRequest(
        @NotBlank
        @Size(max = 120)
        String name,

        @Size(max = 1000)
        String description,

        @NotBlank
        @Size(max = 30)
        String protocol,

        @Size(max = 1000)
        String endpoint
) {}