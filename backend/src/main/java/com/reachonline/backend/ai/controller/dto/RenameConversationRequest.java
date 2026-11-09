
package com.reachonline.backend.ai.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RenameConversationRequest(
        @NotBlank(message = "Conversation title is required.")
        @Size(max = 100, message = "Title cannot exceed 100 characters.")
        String title
) {}
