package com.reachonline.backend.ai.service;

import com.reachonline.backend.contracts.ContractDiffService;
import com.reachonline.backend.contracts.ContractImpactService;
import com.reachonline.backend.governance.service.GovernanceEvaluationService;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.service.AiServices;

import org.springframework.stereotype.Service;

import tools.jackson.databind.json.JsonMapper;

@Service
public class ReachAiService {

    private final ChatModel chatModel;

    private final ContractDiffService contractDiffService;
    private final ContractImpactService contractImpactService;
    private final GovernanceEvaluationService governanceEvaluationService;

    private final JsonMapper jsonMapper;

    public ReachAiService(
            ChatModel chatModel,
            ContractDiffService contractDiffService,
            ContractImpactService contractImpactService,
            GovernanceEvaluationService governanceEvaluationService,
            JsonMapper jsonMapper
    ) {
        this.chatModel = chatModel;
        this.contractDiffService = contractDiffService;
        this.contractImpactService = contractImpactService;
        this.governanceEvaluationService = governanceEvaluationService;
        this.jsonMapper = jsonMapper;
    }

    public String chat(String message, String ownerUserId) {

        ReachPlatformTools platformTools = new ReachPlatformTools(
                contractDiffService,
                contractImpactService,
                governanceEvaluationService,
                jsonMapper,
                ownerUserId
        );

        ReachAiAssistant assistant = AiServices
                .builder(ReachAiAssistant.class)
                .chatModel(chatModel)
                .tools(platformTools)
                .build();

        return assistant.chat(message);
    }
}