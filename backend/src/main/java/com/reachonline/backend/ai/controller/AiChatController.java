package com.reachonline.backend.ai.controller;

import com.reachonline.backend.ai.service.ReachAiService;
import com.reachonline.backend.ai.protection.AiGenerationResult;
import com.reachonline.backend.ai.protection.ClientIpResolver;
import com.reachonline.backend.security.WorkspaceContext;
import com.reachonline.backend.security.WorkspaceRequest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private final ReachAiService reachAiService;
        private final ClientIpResolver clientIpResolver;

        public AiChatController(
                        ReachAiService reachAiService,
                        ClientIpResolver clientIpResolver
        ) {
        this.reachAiService = reachAiService;
                this.clientIpResolver = clientIpResolver;
    }

    @PostMapping("/chat")
    public ChatResponse chat(
            @Valid @RequestBody ChatRequest request,
            HttpServletRequest httpRequest
    ) {

        String authenticatedUserId = WorkspaceContext.userIdOrThrow();
        String ownerUserId = WorkspaceContext.ownerFor(
                WorkspaceRequest.from(httpRequest)
        );

        AiGenerationResult result = reachAiService.chat(
                request.message(),
                ownerUserId,
                authenticatedUserId,
                clientIpResolver.resolve(httpRequest)
        );

        return new ChatResponse(
                result.text(),
                Instant.now()
        );
    }
}