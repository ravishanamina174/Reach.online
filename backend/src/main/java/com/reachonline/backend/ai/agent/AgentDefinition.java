package com.reachonline.backend.ai.agent;

public record AgentDefinition(
        AgentType type,
        String name,
        String description,
        String systemPrompt
) {
}