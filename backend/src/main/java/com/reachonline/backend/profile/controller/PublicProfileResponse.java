package com.reachonline.backend.profile.controller;

import com.reachonline.backend.profile.model.Profile;

import java.time.Instant;

public record PublicProfileResponse(
        String userId,
        String displayName,
        String bio,
        String website,
        Instant updatedAt
) {
    public static PublicProfileResponse from(Profile profile) {
        return new PublicProfileResponse(
                profile.getUserId(),
                profile.getDisplayName(),
                profile.getBio(),
                profile.getWebsite(),
                profile.getUpdatedAt()
        );
    }
}
