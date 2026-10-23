package com.reachonline.backend.governance.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateGovernancePolicyRequest(

        @NotBlank
        @Size(max = 160)
        String name,

        @Size(max = 1000)
        String description,

        @NotBlank
        @Size(max = 80)
        String ruleType,

        @NotBlank
        @Size(max = 10000)
        String configuration,

        boolean enabled
) {
}