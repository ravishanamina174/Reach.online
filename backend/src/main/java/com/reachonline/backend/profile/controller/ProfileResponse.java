package com.reachonline.backend.profile.controller;

import com.reachonline.backend.profile.model.Profile;

import java.time.Instant;

public record ProfileResponse(
        String userId,
        String displayName,
        String bio,
        String website,
        boolean publicProfile,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProfileResponse from(Profile profile) {
        return new ProfileResponse(
                profile.getUserId(),
                profile.getDisplayName(),
                profile.getBio(),
                profile.getWebsite(),
                profile.isPublicProfile(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }
}
