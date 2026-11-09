package com.reachonline.backend.ai.protection;

import dev.langchain4j.model.output.TokenUsage;

public record AiGenerationResult(
        String text,
        TokenUsage tokenUsage
) {}
