package com.reachonline.backend.governance.service;

import com.reachonline.backend.contracts.controller.ContractDiffResponse;
import com.reachonline.backend.contracts.controller.ContractImpactResponse;
import com.reachonline.backend.governance.controller.GovernanceEvaluationResponse;
import com.reachonline.backend.governance.model.GovernancePolicy;
import com.reachonline.backend.governance.repository.GovernancePolicyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class GovernanceEvaluationService {

    private static final String BLOCK_ON_ANY_REMOVAL =
            "BLOCK_ON_ANY_REMOVAL";

    private static final String BLOCK_REMOVED_PROTECTED_PATH =
            "BLOCK_REMOVED_PROTECTED_PATH";

    private static final String WARN_ON_ANY_CHANGE =
            "WARN_ON_ANY_CHANGE";

    private final GovernancePolicyRepository policyRepository;
    private final JsonMapper jsonMapper;

    public GovernanceEvaluationService(
            GovernancePolicyRepository policyRepository,
            JsonMapper jsonMapper
    ) {
        this.policyRepository = policyRepository;
        this.jsonMapper = jsonMapper;
    }

    public GovernanceEvaluationResponse evaluate(
            ContractImpactResponse impact
    ) {
        if (impact == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Contract impact data is required."
            );
        }

        List<GovernancePolicy> enabledPolicies =
                policyRepository.findAllByOrderByCreatedAtDesc()
                        .stream()
                        .filter(GovernancePolicy::isEnabled)
                        .toList();

        List<GovernanceEvaluationResponse.Finding> findings =
                new ArrayList<>();

        for (GovernancePolicy policy : enabledPolicies) {
            validateRuleType(policy.getRuleType());

            List<String> affectedPaths =
                    evaluatePolicy(policy, impact);

            if (!affectedPaths.isEmpty()) {
                String severity = isBlockingRule(policy.getRuleType())
                        ? "BLOCK"
                        : "WARNING";

                findings.add(
                        new GovernanceEvaluationResponse.Finding(
                                policy.getId(),
                                policy.getName(),
                                policy.getRuleType(),
                                severity,
                                buildMessage(policy, affectedPaths),
                                affectedPaths
                        )
                );
            }
        }

        boolean blocked = findings.stream()
                .anyMatch(finding ->
                        "BLOCK".equals(finding.severity()));

        boolean warned = findings.stream()
                .anyMatch(finding ->
                        "WARNING".equals(finding.severity()));

        String decision = blocked
                ? "BLOCKED"
                : warned ? "WARNING" : "PASS";

        String summary = buildSummary(
                impact,
                enabledPolicies.size(),
                findings,
                decision
        );

        return new GovernanceEvaluationResponse(
                impact.contractName(),
                impact.fromVersion(),
                impact.toVersion(),
                decision,
                enabledPolicies.size(),
                findings.size(),
                List.copyOf(findings),
                summary,
                Instant.now()
        );
    }

    private List<String> evaluatePolicy(
            GovernancePolicy policy,
            ContractImpactResponse impact
    ) {
        String ruleType = normalizeRuleType(policy.getRuleType());

        List<ContractDiffResponse.Change> changes =
                impact.changes() == null
                        ? List.of()
                        : impact.changes();

        return switch (ruleType) {
            case BLOCK_ON_ANY_REMOVAL ->
                    removedPaths(changes);

            case BLOCK_REMOVED_PROTECTED_PATH ->
                    findRemovedProtectedPaths(
                            policy.getConfiguration(),
                            changes
                    );

            case WARN_ON_ANY_CHANGE ->
                    impact.hasChanges()
                            ? changedPaths(changes)
                            : List.of();

            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported governance rule type: "
                            + policy.getRuleType()
            );
        };
    }

    private List<String> removedPaths(
            List<ContractDiffResponse.Change> changes
    ) {
        return changes.stream()
                .filter(change ->
                        change.type()
                                == ContractDiffResponse.ChangeType.REMOVED)
                .map(ContractDiffResponse.Change::path)
                .filter(path -> path != null && !path.isBlank())
                .distinct()
                .toList();
    }

    private List<String> changedPaths(
            List<ContractDiffResponse.Change> changes
    ) {
        return changes.stream()
                .map(ContractDiffResponse.Change::path)
                .filter(path -> path != null && !path.isBlank())
                .distinct()
                .toList();
    }

    private List<String> findRemovedProtectedPaths(
            String configuration,
            List<ContractDiffResponse.Change> changes
    ) {
        JsonNode config = parseConfiguration(configuration);
        JsonNode pathsNode = config.get("paths");

        if (pathsNode == null || !pathsNode.isArray()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "BLOCK_REMOVED_PROTECTED_PATH configuration "
                            + "must contain a JSON array named 'paths'."
            );
        }

        Set<String> protectedPaths = new LinkedHashSet<>();

        for (JsonNode node : pathsNode) {
            if (!node.isString()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Every entry in configuration.paths must be a string."
                );
            }

            String path = node.asString();

            if (path == null || path.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Protected paths must not be blank."
                );
            }

            protectedPaths.add(path);
        }

        List<String> removed = removedPaths(changes);

        return removed.stream()
                .filter(removedPath -> protectedPaths.stream()
                        .anyMatch(protectedPath ->
                                removedPath.equals(protectedPath)
                                || removedPath.startsWith(
                                        protectedPath + "/"
                                )))
                .distinct()
                .toList();
    }

    private JsonNode parseConfiguration(String configuration) {
        try {
            return jsonMapper.readTree(configuration);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Governance policy configuration must be valid JSON."
            );
        }
    }

    private void validateRuleType(String ruleType) {
        String normalized = normalizeRuleType(ruleType);

        if (!BLOCK_ON_ANY_REMOVAL.equals(normalized)
                && !BLOCK_REMOVED_PROTECTED_PATH.equals(normalized)
                && !WARN_ON_ANY_CHANGE.equals(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported governance rule type: " + ruleType
            );
        }
    }

    private String normalizeRuleType(String ruleType) {
        return ruleType == null
                ? ""
                : ruleType.trim().toUpperCase(Locale.ROOT);
    }

    private boolean isBlockingRule(String ruleType) {
        String normalized = normalizeRuleType(ruleType);

        return BLOCK_ON_ANY_REMOVAL.equals(normalized)
                || BLOCK_REMOVED_PROTECTED_PATH.equals(normalized);
    }

    private String buildMessage(
            GovernancePolicy policy,
            List<String> affectedPaths
    ) {
        return switch (normalizeRuleType(policy.getRuleType())) {
            case BLOCK_ON_ANY_REMOVAL ->
                    "Contract removals are blocked by policy '"
                            + policy.getName() + "'.";

            case BLOCK_REMOVED_PROTECTED_PATH ->
                    "One or more protected paths were removed under policy '"
                            + policy.getName() + "'.";

            case WARN_ON_ANY_CHANGE ->
                    "Contract changes require attention under policy '"
                            + policy.getName() + "'.";

            default -> "Policy triggered: " + policy.getName();
        } + " Affected paths: " + String.join(", ", affectedPaths);
    }

    private String buildSummary(
            ContractImpactResponse impact,
            int evaluatedPolicyCount,
            List<GovernanceEvaluationResponse.Finding> findings,
            String decision
    ) {
        if (evaluatedPolicyCount == 0) {
            return "No enabled governance policies were available. "
                    + "The PASS decision means no configured rule blocked "
                    + "this change; it is not a compatibility guarantee.";
        }

        if ("BLOCKED".equals(decision)) {
            return "Governance blocked the proposed contract change. "
                    + findings.size()
                    + " policy finding(s) were triggered. Review the "
                    + "affected paths before release.";
        }

        if ("WARNING".equals(decision)) {
            return "Governance found changes requiring review. "
                    + findings.size()
                    + " policy finding(s) were triggered, but no blocking "
                    + "policy was triggered.";
        }

        return impact.hasChanges()
                ? "No enabled governance policy was triggered by the "
                    + "detected contract changes."
                : "No contract changes were detected, and no enabled "
                    + "governance policy was triggered.";
    }
}