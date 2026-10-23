package com.reachonline.backend.governance.controller;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record GovernanceEvaluationResponse(
        String contractName,
        String fromVersion,
        String toVersion,
        String decision,
        int evaluatedPolicyCount,
        int triggeredPolicyCount,
        List<Finding> findings,
        String summary,
        Instant evaluatedAt
) {
    public record Finding(
            UUID policyId,
            String policyName,
            String ruleType,
            String severity,
            String message,
            List<String> affectedPaths
    ) {
    }
}