package com.reachonline.backend.ai.protection;

import java.util.UUID;

public record AiGenerationReservation(
        UUID id,
        long reservedTokens
) {}
