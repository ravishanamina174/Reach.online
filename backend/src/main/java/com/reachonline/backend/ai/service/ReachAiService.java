package com.reachonline.backend.ai.service;

import dev.langchain4j.model.chat.ChatModel;
import org.springframework.stereotype.Service;

@Service
public class ReachAiService {

    private final ChatModel chatModel;

    private static final String SYSTEM_PROMPT = """
            You are Reach AI, the AI assistant of Reach.Online.

            Reach.Online is an AI Agent API Governance Platform.

            Your responsibilities:
            - Explain API and MCP contracts.
            - Explain AI agent and tool dependencies.
            - Help users understand contract changes.
            - Explain governance concepts and policies.
            - Provide clear software engineering guidance.

            Rules:
            - Give accurate, concise and understandable answers.
            - Do not invent platform data or analysis results.
            - Do not claim to have accessed platform records unless
              they have actually been provided to you.
            - Do not claim to execute actions or modify records.
            - Clearly distinguish general explanations from
              verified platform analysis.
            """;

    public ReachAiService(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    public String chat(String message) {
        return chatModel.chat(
                SYSTEM_PROMPT + "\n\nUser message:\n" + message
        );
    }
}