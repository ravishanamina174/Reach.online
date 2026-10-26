package com.reachonline.backend.release.controller;

import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

public record ReleaseReviewResponse(
        UUID id,
        UUID contractId,
        String contractName,
        String baselineVersion,
        String proposedVersion,
        String status,
        JsonNode findings,
        Instant createdAt,
        Instant completedAt
) {
}