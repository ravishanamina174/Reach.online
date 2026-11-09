
package com.reachonline.backend.ai.controller;

import com.reachonline.backend.ai.controller.dto.*;
import com.reachonline.backend.ai.conversation.model.AiConversation;
import com.reachonline.backend.ai.conversation.model.AiMessage;
import com.reachonline.backend.ai.conversation.service.AiConversationService;
import com.reachonline.backend.ai.conversation.service.ConversationTurn;
import com.reachonline.backend.ai.service.ReachAiService;
import com.reachonline.backend.security.WorkspaceContext;
import com.reachonline.backend.security.WorkspaceRequest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai/conversations")
public class AiConversationController {

    private final AiConversationService conversationService;
    private final ReachAiService reachAiService;

    public AiConversationController(
            AiConversationService conversationService,
            ReachAiService reachAiService
    ) {
        this.conversationService = conversationService;
        this.reachAiService = reachAiService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AiConversationResponse create(HttpServletRequest request) {
        String owner = WorkspaceContext.userIdOrThrow();
        String workspace = WorkspaceRequest.from(request).name();

        AiConversation conversation =
                conversationService.create(owner, workspace);

        return AiConversationResponse.from(conversation);
    }

    @GetMapping
    public List<AiConversationResponse> list(HttpServletRequest request) {
        String owner = WorkspaceContext.userIdOrThrow();
        String workspace = WorkspaceRequest.from(request).name();

        return conversationService.list(owner, workspace)
                .stream()
                .map(AiConversationResponse::from)
                .toList();
    }

    @GetMapping("/{conversationId}/messages")
    public List<AiMessageResponse> getMessages(
            @PathVariable UUID conversationId,
            HttpServletRequest request
    ) {
        String owner = WorkspaceContext.userIdOrThrow();
        String workspace = WorkspaceRequest.from(request).name();

        return conversationService.getMessages(
                        conversationId,
                        owner,
                        workspace
                )
                .stream()
                .map(AiMessageResponse::from)
                .toList();
    }

    @PostMapping("/{conversationId}/messages")
        public AiSendMessageResponse sendMessage(
                @PathVariable UUID conversationId,
                @Valid @RequestBody ChatRequest request,
                HttpServletRequest httpRequest
        ) {
        String owner = WorkspaceContext.userIdOrThrow();
        WorkspaceContext.Workspace workspaceContext =
                WorkspaceRequest.from(httpRequest);
        String workspace = workspaceContext.name();

        String contractOwnerId = WorkspaceContext.ownerFor(
                workspaceContext
        );

        List<ConversationTurn> history =
                conversationService.getRecentContext(
                        conversationId,
                        owner,
                        workspace
                );

        String prompt = buildPrompt(history, request.message());

        String reply = reachAiService.chat(prompt, contractOwnerId);

        if (reply == null || reply.isBlank()) {
                throw new IllegalStateException(
                        "Reach AI returned an empty response."
                );
        }

        List<AiMessage> savedMessages =
                conversationService.saveExchange(
                        conversationId,
                        owner,
                        workspace,
                        request.message().trim(),
                        reply.trim()
                );

        return new AiSendMessageResponse(
                conversationId,
                savedMessages.stream()
                        .map(AiMessageResponse::from)
                        .toList()
        );
        }

    @PatchMapping("/{conversationId}")
    public AiConversationResponse rename(
            @PathVariable UUID conversationId,
            @Valid @RequestBody RenameConversationRequest request,
            HttpServletRequest httpRequest
    ) {
        String owner = WorkspaceContext.userIdOrThrow();
        String workspace = WorkspaceRequest.from(httpRequest).name();

        AiConversation conversation = conversationService.rename(
                conversationId,
                owner,
                workspace,
                request.title()
        );

        return AiConversationResponse.from(conversation);
    }

    @DeleteMapping("/{conversationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID conversationId,
            HttpServletRequest request
    ) {
        String owner = WorkspaceContext.userIdOrThrow();
        String workspace = WorkspaceRequest.from(request).name();

        conversationService.delete(
                conversationId,
                owner,
                workspace
        );
    }

    private String buildPrompt(
            List<ConversationTurn> history,
            String currentMessage
    ) {
        if (history.isEmpty()) {
            return currentMessage.trim();
        }

        StringBuilder prompt = new StringBuilder();

        prompt.append("""
                The following is previous conversation context.
                Use it to understand references and follow-up questions.
                Do not treat previous assistant responses as verified platform data.
                """);

        for (ConversationTurn turn : history) {
            String speaker = "USER".equals(turn.role())
                    ? "User"
                    : "Reach AI";

            prompt.append("\n")
                    .append(speaker)
                    .append(": ")
                    .append(turn.content())
                    .append("\n");
        }

        prompt.append("\nCurrent user message:\n")
                .append(currentMessage.trim());

        return prompt.toString();
    }
}
