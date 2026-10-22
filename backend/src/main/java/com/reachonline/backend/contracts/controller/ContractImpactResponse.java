
package com.reachonline.backend.contracts.controller;

import java.util.List;
import java.util.UUID;

public record ContractImpactResponse(
        String contractName,
        String fromVersion,
        String toVersion,
        boolean hasChanges,
        boolean toolRegistered,
        String analysisStatus,
        int changedPathCount,
        int affectedAgentCount,
        List<ContractDiffResponse.Change> changes,
        List<AgentImpact> affectedAgents,
        String summary
) {
    public record AgentImpact(
            UUID agentId,
            String agentName,
            String agentType,
            String agentStatus,
            UUID toolId,
            String toolName,
            String toolStatus,
            String consumerExpectations,
            List<String> potentiallyAffectedPaths,
            String explanation
    ) {
    }
}
