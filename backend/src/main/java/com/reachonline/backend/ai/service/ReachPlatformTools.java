package com.reachonline.backend.ai.service;

import com.reachonline.backend.contracts.ContractDiffService;
import com.reachonline.backend.contracts.ContractImpactService;
import com.reachonline.backend.contracts.controller.ContractImpactResponse;
import com.reachonline.backend.governance.service.GovernanceEvaluationService;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;

import tools.jackson.databind.json.JsonMapper;

import java.util.Map;

public class ReachPlatformTools {

    private final ContractDiffService contractDiffService;
    private final ContractImpactService contractImpactService;
    private final GovernanceEvaluationService governanceEvaluationService;
    private final JsonMapper jsonMapper;

    /*
     * This owner ID is provided by the authenticated backend.
     * It is never supplied by the AI model.
     */
    private final String ownerUserId;

    public ReachPlatformTools(
            ContractDiffService contractDiffService,
            ContractImpactService contractImpactService,
            GovernanceEvaluationService governanceEvaluationService,
            JsonMapper jsonMapper,
            String ownerUserId
    ) {
        this.contractDiffService = contractDiffService;
        this.contractImpactService = contractImpactService;
        this.governanceEvaluationService = governanceEvaluationService;
        this.jsonMapper = jsonMapper;
        this.ownerUserId = ownerUserId;
    }

    @Tool("""
            Compare two versions of a registered API or MCP contract.
            Returns the actual changes detected by the platform.
            Use this when the user asks about contract differences.
            """)
    public String compareContractVersions(
            @P("Exact registered contract name") String contractName,
            @P("Source contract version") String fromVersion,
            @P("Target contract version") String toVersion
    ) {
        var result = contractDiffService.compare(
                contractName,
                fromVersion,
                toVersion,
                ownerUserId
        );

        return toJson(result);
    }

    @Tool("""
            Analyze the potential impact of contract changes.
            Returns registered tools, dependent agents and potential
            impact information from the platform.
            Use this when the user asks which agents or tools may be affected.
            """)
    public String analyzeDependencyImpact(
            @P("Exact registered contract name") String contractName,
            @P("Source contract version") String fromVersion,
            @P("Target contract version") String toVersion
    ) {
        var result = contractImpactService.analyze(
                contractName,
                fromVersion,
                toVersion,
                ownerUserId
        );

        return toJson(result);
    }

    @Tool("""
            Evaluate the enabled governance policies against the impact
            of a contract change.
            Returns the actual policy findings and decision calculated
            by the existing governance service.
            Use this when the user asks about governance or release readiness.
            """)
    public String evaluateGovernance(
            @P("Exact registered contract name") String contractName,
            @P("Source contract version") String fromVersion,
            @P("Target contract version") String toVersion
    ) {
        ContractImpactResponse impact = contractImpactService.analyze(
                contractName,
                fromVersion,
                toVersion,
                ownerUserId
        );

        var governance = governanceEvaluationService.evaluate(
                impact,
                ownerUserId
        );

        return toJson(Map.of(
                "impact", impact,
                "governance", governance
        ));
    }

    private String toJson(Object result) {
        try {
            return jsonMapper.writeValueAsString(result);
        } catch (RuntimeException exception) {
            throw new IllegalStateException(
                    "Could not serialize platform analysis results.",
                    exception
            );
        }
    }
}