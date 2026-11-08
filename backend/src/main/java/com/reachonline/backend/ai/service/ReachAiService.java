package com.reachonline.backend.ai.service;

import com.reachonline.backend.ai.agent.AgentDefinition;
import com.reachonline.backend.ai.agent.AgentRegistry;
import com.reachonline.backend.ai.agent.AgentType;

import dev.langchain4j.model.chat.ChatModel;

import org.springframework.stereotype.Service;

@Service
public class ReachAiService {

    private final ChatModel chatModel;
    private final AgentRegistry agentRegistry;

    public ReachAiService(
            ChatModel chatModel,
            AgentRegistry agentRegistry
    ) {
        this.chatModel = chatModel;
        this.agentRegistry = agentRegistry;
    }

    public String chat(String message) {

        AgentDefinition agent = agentRegistry
                .getAgent(AgentType.ORCHESTRATOR)
                .orElseThrow();

        String prompt = """
                %s

                User message:
                %s

                Identify the most suitable specialist agent.

                Return only one of these exact values:
                CONTRACT_ANALYSIS
                DEPENDENCY_IMPACT
                GOVERNANCE
                GENERAL
                """.formatted(
                agent.systemPrompt(),
                message
        );

        String selectedAgent = chatModel.chat(prompt).trim();

        AgentType agentType = resolveAgent(selectedAgent);

        AgentDefinition selectedDefinition = agentRegistry
                .getAgent(agentType)
                .orElseThrow();

        String specialistPrompt = """
                %s

                User question:
                %s

                Answer the user clearly and accurately.
                Do not invent platform data.
                """.formatted(
                selectedDefinition.systemPrompt(),
                message
        );

        return chatModel.chat(specialistPrompt);
    }

    private AgentType resolveAgent(String selectedAgent) {

        return switch (selectedAgent.toUpperCase()) {

            case "CONTRACT_ANALYSIS" ->
                    AgentType.CONTRACT_ANALYSIS;

            case "DEPENDENCY_IMPACT" ->
                    AgentType.DEPENDENCY_IMPACT;

            case "GOVERNANCE" ->
                    AgentType.GOVERNANCE;

            default ->
                    AgentType.ORCHESTRATOR;
        };
    }
}