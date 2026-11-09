package com.reachonline.backend.ai.service;

import com.reachonline.backend.contracts.ContractDiffService;
import com.reachonline.backend.contracts.ContractImpactService;
import com.reachonline.backend.governance.service.GovernanceEvaluationService;
import com.reachonline.backend.ai.protection.AiGenerationReservation;
import com.reachonline.backend.ai.protection.AiGenerationResult;
import com.reachonline.backend.ai.protection.AiProtectionService;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.service.AiServices;

import org.springframework.stereotype.Service;

import tools.jackson.databind.json.JsonMapper;

import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class ReachAiService {

    private final ChatModel chatModel;

    private final ContractDiffService contractDiffService;
    private final ContractImpactService contractImpactService;
    private final GovernanceEvaluationService governanceEvaluationService;
    private final AiProtectionService aiProtectionService;

    private final JsonMapper jsonMapper;

    public ReachAiService(
            ChatModel chatModel,
            ContractDiffService contractDiffService,
            ContractImpactService contractImpactService,
            GovernanceEvaluationService governanceEvaluationService,
            JsonMapper jsonMapper,
            AiProtectionService aiProtectionService
    ) {
        this.chatModel = chatModel;
        this.contractDiffService = contractDiffService;
        this.contractImpactService = contractImpactService;
        this.governanceEvaluationService = governanceEvaluationService;
        this.jsonMapper = jsonMapper;
        this.aiProtectionService = aiProtectionService;
    }

    public AiGenerationResult chat(
            String message,
            String ownerUserId,
            String authenticatedUserId,
            String ipAddress
    ) {
        AiGenerationReservation reservation = aiProtectionService.reserve(
            authenticatedUserId,
            ipAddress,
            message
        );

        ScheduledFuture<?> heartbeat = null;
        AtomicBoolean heartbeatFailed = new AtomicBoolean();
        boolean providerCompleted = false;
        boolean providerCallStarted = false;
        ChatResponse response = null;

        try {
                heartbeat = aiProtectionService.startHeartbeat(
                    reservation,
                    heartbeatFailed
                );

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

            providerCallStarted = true;
            response = assistant.chat(message);
            providerCompleted = true;
            if (heartbeatFailed.get()) {
                throw new IllegalStateException(
                        "The AI reservation heartbeat could not be maintained."
                );
            }
            return new AiGenerationResult(
                    response.aiMessage().text(),
                    response.tokenUsage()
            );
        } finally {
            try {
                aiProtectionService.reconcile(
                        reservation,
                        providerCompleted,
                        response == null ? null : response.tokenUsage(),
                        !providerCallStarted
                );
            } finally {
                if (heartbeat != null) {
                    heartbeat.cancel(false);
                }
            }
        }
    }
}