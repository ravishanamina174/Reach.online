package com.reachonline.backend.profile.controller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 160) String displayName,
        @Size(max = 2000) String bio,
        @Size(max = 500) String website,
        boolean publicProfile
) {}
