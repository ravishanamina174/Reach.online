package com.reachonline.backend.governance;

import com.reachonline.backend.contracts.repository.ContractRepository;
import com.reachonline.backend.governance.repository.GovernancePolicyRepository;
import com.reachonline.backend.release.repository.ReleaseReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class GovernanceEvaluationIntegrationTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private GovernancePolicyRepository policyRepository;
    @Autowired private ContractRepository contractRepository;
    @Autowired private ReleaseReviewRepository releaseReviewRepository;

    @BeforeEach
    void cleanDatabase() {
        releaseReviewRepository.deleteAll();
        policyRepository.deleteAll();
        contractRepository.deleteAll();
    }

    @Test
    void persistsPoliciesEvaluatesContractChangesAndSerializesReleaseFindings() throws Exception {
        mockMvc.perform(post("/api/governance/policies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"block-removals","ruleType":"BLOCK_ON_ANY_REMOVAL",
                                 "configuration":"{}","enabled":true}
                                """))
                .andExpect(status().isCreated());

        createContract("1.0.0", "{\"input\":{\"required\":[\"id\"]},\"description\":\"old\"}");
        createContract("2.0.0", "{\"input\":{},\"description\":\"new\"}");

        mockMvc.perform(post("/api/governance/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"impact":{"contractName":"tool","fromVersion":"1.0.0",
                                "toVersion":"2.0.0","hasChanges":true,"toolRegistered":true,
                                "analysisStatus":"IMPACT_DETECTED","changedPathCount":2,
                                "affectedAgentCount":0,"changes":[
                                  {"path":"/description","type":"CHANGED","before":"old","after":"new"},
                                  {"path":"/input/required","type":"REMOVED","before":["id"],"after":null}],
                                "affectedAgents":[],"summary":"changed"}}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision").value("BLOCKED"))
                .andExpect(jsonPath("$.findings[0].affectedPaths[0]").value("/input/required"));

        mockMvc.perform(post("/api/release-reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"contractName":"tool","fromVersion":"1.0.0","proposedVersion":"2.0.0"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("BLOCKED"))
                .andExpect(jsonPath("$.findings.governance.decision").value("BLOCKED"))
                .andExpect(jsonPath("$.findings.impact.changedPathCount").value(2));

        mockMvc.perform(get("/api/release-reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("BLOCKED"));
    }

    @Test
    void enabledStateAndWorkspaceOwnerIsolationAreEnforced() throws Exception {
        mockMvc.perform(post("/api/governance/policies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"disabled-warning","ruleType":"WARN_ON_ANY_CHANGE",
                                 "configuration":"{}","enabled":false}
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/governance/policies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].enabled").value(false));

        mockMvc.perform(post("/api/governance/policies")
                        .header("X-Reach-Workspace", "BAD")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"invalid","ruleType":"WARN_ON_ANY_CHANGE",
                                 "configuration":"{}","enabled":true}
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/governance/policies")
                        .header("X-Reach-Workspace", "DEMO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("disabled-warning"));
    }

    private void createContract(String version, String content) throws Exception {
        mockMvc.perform(post("/api/contracts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"tool","contractType":"MCP_TOOL","version":"%s","content":%s}
                                """.formatted(version, content)))
                .andExpect(status().isCreated());
    }
}
