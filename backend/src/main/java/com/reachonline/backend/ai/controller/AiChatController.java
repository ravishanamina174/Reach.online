package com.reachonline.backend.ai.controller;

import com.reachonline.backend.ai.service.ReachAiService;
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

    public AiChatController(ReachAiService reachAiService) {
        this.reachAiService = reachAiService;
    }

    @PostMapping("/chat")
    public ChatResponse chat(
            @Valid @RequestBody ChatRequest request,
            HttpServletRequest httpRequest
    ) {

        String ownerUserId = WorkspaceContext.ownerFor(
                WorkspaceRequest.from(httpRequest)
        );

        String reply = reachAiService.chat(
                request.message(),
                ownerUserId
        );

        return new ChatResponse(
                reply,
                Instant.now()
        );
    }
}