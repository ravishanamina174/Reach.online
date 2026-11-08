package com.reachonline.backend.ai.controller;

import com.reachonline.backend.ai.service.ReachAiService;
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
            @Valid @RequestBody ChatRequest request
    ) {
        String reply = reachAiService.chat(request.message());

        return new ChatResponse(reply, Instant.now());
    }
}