
package com.reachonline.backend.ai.controller.dto;

import java.util.List;
import java.util.UUID;

public record AiSendMessageResponse(
        UUID conversationId,
        List<AiMessageResponse> messages
) {}
