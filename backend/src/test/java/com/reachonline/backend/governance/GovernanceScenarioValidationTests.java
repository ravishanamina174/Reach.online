package com.reachonline.backend.governance;

import com.reachonline.backend.contracts.controller.ContractDiffResponse;
import com.reachonline.backend.contracts.controller.ContractImpactResponse;
import com.reachonline.backend.governance.controller.GovernanceEvaluationResponse;
import com.reachonline.backend.governance.model.GovernancePolicy;
import com.reachonline.backend.governance.repository.GovernancePolicyRepository;
import com.reachonline.backend.governance.service.GovernanceEvaluationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

/** Deterministic black-box validation with an oracle independent of the service implementation. */
@ExtendWith(MockitoExtension.class)
class GovernanceScenarioValidationTests {

    private static final long SEED = 20261119L;
    private static final int SCENARIO_COUNT = 120;

    @Mock
    private GovernancePolicyRepository policyRepository;

    private final JsonMapper mapper = JsonMapper.builder().build();

    @Test
    void validatesDeterministicGovernanceScenariosAndWritesEvidence() throws Exception {
        GovernanceEvaluationService service = new GovernanceEvaluationService(policyRepository, mapper);
        Random random = new Random(SEED);
        List<ScenarioResult> results = new ArrayList<>();

        for (int index = 0; index < SCENARIO_COUNT; index++) {
            List<ContractDiffResponse.Change> changes = generateChanges(random, index);
            List<GovernancePolicy> policies = generatePolicies(index);
            when(policyRepository.findAllByOwnerUserIdOrderByCreatedAtDesc("scenario-owner"))
                    .thenReturn(policies);

            ContractImpactResponse impact = new ContractImpactResponse(
                    "scenario-tool", "1.0.0", "2.0." + index, !changes.isEmpty(), true,
                    changes.isEmpty() ? "NO_CHANGES" : "IMPACT_DETECTED", changes.size(), 0,
                    changes, List.of(), "generated scenario");
            GovernanceEvaluationResponse actual = service.evaluate(impact, "scenario-owner");
            Expected expected = independentOracle(policies, changes);
            Map<String, List<String>> actualPaths = new LinkedHashMap<>();
            actual.findings().forEach(finding -> actualPaths.put(finding.ruleType(), finding.affectedPaths()));

            results.add(new ScenarioResult(
                    "scenario-%03d".formatted(index + 1),
                    scenarioDefinition(index, policies, changes),
                    expected.decision(), actual.decision(), expected.paths(), actualPaths,
                    expected.decision().equals(actual.decision()) && expected.paths().equals(actualPaths)
            ));
        }

        writeEvidence(results);
        long passed = results.stream().filter(ScenarioResult::passed).count();
        long decisionMatches = results.stream()
                .filter(result -> result.expectedDecision().equals(result.actualDecision()))
                .count();
        assertEquals(SCENARIO_COUNT, results.size());
        assertEquals(SCENARIO_COUNT, passed,
                () -> "Scenario mismatches: " + results.stream().filter(r -> !r.passed()).toList());
        assertEquals(SCENARIO_COUNT, decisionMatches);
    }

    private List<ContractDiffResponse.Change> generateChanges(Random random, int index) {
        String[] paths = {"/input/id", "/input/limit", "/output/name", "/description", "/user", "/username"};
        ContractDiffResponse.ChangeType[] types = ContractDiffResponse.ChangeType.values();
        int count = index % 5 == 0 ? 0 : 1 + random.nextInt(4);
        List<ContractDiffResponse.Change> changes = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String path = paths[random.nextInt(paths.length)];
            ContractDiffResponse.ChangeType type = types[random.nextInt(types.length)];
            changes.add(new ContractDiffResponse.Change(path, type, null, null));
        }
        if (index % 7 == 0) {
            changes.add(new ContractDiffResponse.Change("/user/name", ContractDiffResponse.ChangeType.REMOVED, null, null));
        }
        return changes;
    }

    private List<GovernancePolicy> generatePolicies(int index) {
        List<GovernancePolicy> policies = new ArrayList<>();
        switch (index % 6) {
            case 0 -> { }
            case 1 -> policies.add(policy("BLOCK_ON_ANY_REMOVAL", true, "{}"));
            case 2 -> policies.add(policy("WARN_ON_ANY_CHANGE", true, "{}"));
            case 3 -> policies.add(policy("BLOCK_REMOVED_PROTECTED_PATH", true, "{\"paths\":[\"/user\"]}"));
            case 4 -> {
                policies.add(policy("BLOCK_ON_ANY_REMOVAL", true, "{}"));
                policies.add(policy("WARN_ON_ANY_CHANGE", true, "{}"));
            }
            case 5 -> {
                policies.add(policy("BLOCK_ON_ANY_REMOVAL", false, "{}"));
                policies.add(policy("WARN_ON_ANY_CHANGE", true, "{}"));
            }
        }
        return policies;
    }

    private GovernancePolicy policy(String rule, boolean enabled, String configuration) {
        return new GovernancePolicy(rule + "-scenario", null, rule, configuration, enabled, "scenario-owner");
    }

    private Expected independentOracle(List<GovernancePolicy> policies,
                                       List<ContractDiffResponse.Change> changes) {
        Map<String, List<String>> findings = new LinkedHashMap<>();
        boolean blocked = false;
        boolean warned = false;
        List<String> removals = changes.stream()
                .filter(change -> change.type() == ContractDiffResponse.ChangeType.REMOVED)
                .map(ContractDiffResponse.Change::path).distinct().toList();
        List<String> allPaths = changes.stream().map(ContractDiffResponse.Change::path).distinct().toList();
        for (GovernancePolicy policy : policies) {
            if (!policy.isEnabled()) continue;
            List<String> affected;
            if ("BLOCK_ON_ANY_REMOVAL".equals(policy.getRuleType())) {
                affected = removals;
                blocked |= !affected.isEmpty();
            } else if ("WARN_ON_ANY_CHANGE".equals(policy.getRuleType())) {
                affected = allPaths;
                warned |= !affected.isEmpty();
            } else {
                affected = removals.stream().filter(path -> path.equals("/user") || path.startsWith("/user/")).toList();
                blocked |= !affected.isEmpty();
            }
            if (!affected.isEmpty()) findings.put(policy.getRuleType(), affected);
        }
        return new Expected(blocked ? "BLOCKED" : warned ? "WARNING" : "PASS", findings);
    }

    private String scenarioDefinition(int index, List<GovernancePolicy> policies,
                                      List<ContractDiffResponse.Change> changes) {
        return "index=" + index + ";policies=" + policies.stream().map(GovernancePolicy::getRuleType).toList()
                + ";enabled=" + policies.stream().map(GovernancePolicy::isEnabled).toList()
                + ";changes=" + changes.stream().map(change -> change.type() + ":" + change.path()).toList();
    }

    private void writeEvidence(List<ScenarioResult> results) throws IOException {
        Path directory = Path.of("target", "governance-validation");
        Files.createDirectories(directory);
        long passed = results.stream().filter(ScenarioResult::passed).count();
        long decisionMatches = results.stream()
                .filter(result -> result.expectedDecision().equals(result.actualDecision())).count();
        double passRate = percentage(passed, results.size());
        double accuracy = percentage(decisionMatches, results.size());

        Files.writeString(directory.resolve("scenarios.json"), mapper.writeValueAsString(Map.of(
                "seed", SEED, "totalScenarios", results.size(), "passed", passed,
                "failed", results.size() - passed, "scenarioPassRate", passRate,
                "decisionAccuracy", accuracy, "scenarios", results)));

        StringBuilder csv = new StringBuilder("scenarioId,expectedDecision,actualDecision,passed,definition,expectedPaths,actualPaths\n");
        for (ScenarioResult result : results) {
            csv.append(csv(result.id())).append(',').append(csv(result.expectedDecision())).append(',')
                    .append(csv(result.actualDecision())).append(',').append(result.passed()).append(',')
                    .append(csv(result.definition())).append(',').append(csv(result.expectedPaths().toString()))
                    .append(',').append(csv(result.actualPaths().toString())).append('\n');
        }
        Files.writeString(directory.resolve("scenarios.csv"), csv.toString());

        Files.writeString(directory.resolve("REPORT.md"), """
                # Reach.online Governance Validation Report

                - Random seed: `%d`
                - Total scenarios: %d
                - Passed: %d
                - Failed: %d
                - Scenario pass rate: %.2f%%
                - Decision accuracy: %.2f%%
                - Expected/actual decisions and affected paths: `scenarios.json`, `scenarios.csv`
                - Database: H2 in-memory database isolated by the test profile; no production Neon data is used.
                - JaCoCo governance report: `target/site/jacoco/index.html` and `target/site/jacoco/jacoco.xml` (generated by `mvn verify`).

                The scenario oracle independently evaluates enabled policies, removals, protected-path descendants,
                warnings, and BLOCKED > WARNING > PASS precedence. No production evaluator output is used as expected data.
                """.formatted(SEED, results.size(), passed, results.size() - passed, passRate, accuracy));
    }

    private String csv(String value) {
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }

    private double percentage(long numerator, long denominator) {
        return denominator == 0 ? 0.0 : numerator * 100.0 / denominator;
    }

    private record Expected(String decision, Map<String, List<String>> paths) { }
    private record ScenarioResult(String id, String definition, String expectedDecision,
                                  String actualDecision, Map<String, List<String>> expectedPaths,
                                  Map<String, List<String>> actualPaths, boolean passed) { }
}
