package com.reachonline.backend.ai.controller;

import java.time.Instant;

public record ChatResponse(
        String reply,
        Instant timestamp
) {}