
package com.reachonline.backend.ai.controller.dto;

import com.reachonline.backend.ai.conversation.model.AiConversation;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AiConversationResponse(
        UUID id,
        String title,
        String workspace,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static AiConversationResponse from(AiConversation conversation) {
        return new AiConversationResponse(
                conversation.getId(),
                conversation.getTitle(),
                conversation.getWorkspace(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt()
        );
    }
}
