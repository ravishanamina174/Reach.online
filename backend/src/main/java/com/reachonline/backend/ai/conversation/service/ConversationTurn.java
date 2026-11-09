
package com.reachonline.backend.ai.conversation.service;

public record ConversationTurn(
        String role,
        String content
) {}
