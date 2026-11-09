
package com.reachonline.backend.ai.controller.dto;

import com.reachonline.backend.ai.conversation.model.AiMessage;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AiMessageResponse(
        UUID id,
        String role,
        String content,
        OffsetDateTime createdAt
) {
    public static AiMessageResponse from(AiMessage message) {
        return new AiMessageResponse(
                message.getId(),
                message.getRole(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
