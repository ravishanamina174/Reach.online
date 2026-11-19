package com.reachonline.backend.governance;

import com.reachonline.backend.contracts.controller.ContractDiffResponse;
import com.reachonline.backend.contracts.controller.ContractImpactResponse;
import com.reachonline.backend.governance.controller.GovernanceEvaluationResponse;
import com.reachonline.backend.governance.model.GovernancePolicy;
import com.reachonline.backend.governance.repository.GovernancePolicyRepository;
import com.reachonline.backend.governance.service.GovernanceEvaluationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GovernanceEvaluationServiceTests {

    @Mock
    private GovernancePolicyRepository policyRepository;

    private GovernanceEvaluationService service;

    private final JsonMapper mapper = JsonMapper.builder().build();

    @BeforeEach
    void setUp() {
        service = new GovernanceEvaluationService(policyRepository, mapper);
    }

    @Test
    void evaluatesAllRulesAndDecisionPrecedence() throws Exception {
        GovernancePolicy removal = policy("removals", "BLOCK_ON_ANY_REMOVAL", "{}");
        GovernancePolicy protectedPath = policy("protected", "BLOCK_REMOVED_PROTECTED_PATH",
                "{\"paths\":[\"/input\"]}");
        GovernancePolicy warning = policy("warning", "WARN_ON_ANY_CHANGE", "{}");
        when(policyRepository.findAllByOwnerUserIdOrderByCreatedAtDesc("owner"))
                .thenReturn(List.of(removal, protectedPath, warning));

        GovernanceEvaluationResponse result = service.evaluate(impact(
                change("/input/required", ContractDiffResponse.ChangeType.REMOVED),
                change("/description", ContractDiffResponse.ChangeType.CHANGED),
                change("/output", ContractDiffResponse.ChangeType.ADDED)), "owner");

        assertEquals("BLOCKED", result.decision());
        assertEquals(3, result.evaluatedPolicyCount());
        assertEquals(3, result.triggeredPolicyCount());
        assertEquals(List.of("/input/required"), result.findings().get(0).affectedPaths());
        assertEquals(List.of("/input/required"), result.findings().get(1).affectedPaths());
        assertEquals(List.of("/input/required", "/description", "/output"),
                result.findings().get(2).affectedPaths());
    }

    @Test
    void returnsWarningForChangeWithoutBlockingRule() throws Exception {
        GovernancePolicy policy = policy("warning", "WARN_ON_ANY_CHANGE", "{}");
        when(policyRepository.findAllByOwnerUserIdOrderByCreatedAtDesc("owner"))
                .thenReturn(List.of(policy));

        GovernanceEvaluationResponse result = service.evaluate(impact(
                change("/description", ContractDiffResponse.ChangeType.CHANGED)), "owner");

        assertEquals("WARNING", result.decision());
        assertEquals("WARNING", result.findings().get(0).severity());
    }

    @Test
    void returnsPassForNoChangesOrDisabledAndOtherOwnersAreIgnored() throws Exception {
        GovernancePolicy disabled = policy("disabled", "BLOCK_ON_ANY_REMOVAL", "{}");
        disabled.setEnabled(false);
        GovernancePolicy otherOwner = new GovernancePolicy("other", null,
                "BLOCK_ON_ANY_REMOVAL", "{}", true, "other-owner");
        when(policyRepository.findAllByOwnerUserIdOrderByCreatedAtDesc("owner"))
                .thenReturn(List.of(disabled));

        GovernanceEvaluationResponse result = service.evaluate(impact(), "owner");

        assertEquals("PASS", result.decision());
        assertEquals(0, result.evaluatedPolicyCount());
        assertTrue(result.findings().isEmpty());
        assertNotEquals(otherOwner.getOwnerUserId(), "owner");
    }

    @Test
    void protectedPathUsesExactAndDescendantMatchingOnly() throws Exception {
        GovernancePolicy policy = policy("protected", "BLOCK_REMOVED_PROTECTED_PATH",
                "{\"paths\":[\"/user\"]}");
        when(policyRepository.findAllByOwnerUserIdOrderByCreatedAtDesc("owner"))
                .thenReturn(List.of(policy));

        GovernanceEvaluationResponse result = service.evaluate(impact(
                change("/user/name", ContractDiffResponse.ChangeType.REMOVED),
                change("/username", ContractDiffResponse.ChangeType.REMOVED),
                change("/user", ContractDiffResponse.ChangeType.REMOVED)), "owner");

        assertEquals("BLOCKED", result.decision());
        assertEquals(List.of("/user/name", "/user"), result.findings().get(0).affectedPaths());
    }

    @Test
    void rejectsUnsupportedRulesAndMalformedProtectedConfiguration() throws Exception {
        GovernancePolicy unsupported = policy("unsupported", "NO_SUCH_RULE", "{}");
        when(policyRepository.findAllByOwnerUserIdOrderByCreatedAtDesc("owner"))
                .thenReturn(List.of(unsupported));
        assertThrows(ResponseStatusException.class, () -> service.evaluate(impact(), "owner"));

        GovernancePolicy malformed = policy("malformed", "BLOCK_REMOVED_PROTECTED_PATH", "[]");
        when(policyRepository.findAllByOwnerUserIdOrderByCreatedAtDesc("owner"))
                .thenReturn(List.of(malformed));
        assertThrows(ResponseStatusException.class, () -> service.evaluate(impact(), "owner"));
        assertThrows(ResponseStatusException.class, () -> service.evaluate(null, "owner"));
    }

    private GovernancePolicy policy(String name, String rule, String config) {
        return new GovernancePolicy(name, null, rule, config, true, "owner");
    }

    private ContractImpactResponse impact(ContractDiffResponse.Change... changes) {
        List<ContractDiffResponse.Change> list = List.of(changes);
        return new ContractImpactResponse("tool", "1.0.0", "2.0.0", !list.isEmpty(),
                true, "IMPACT_DETECTED", list.size(), 0, list, List.of(), "test");
    }

    private ContractDiffResponse.Change change(String path, ContractDiffResponse.ChangeType type)
            throws Exception {
        return new ContractDiffResponse.Change(path, type, mapper.readTree("null"), mapper.readTree("null"));
    }
}
