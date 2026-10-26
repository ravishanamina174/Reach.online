package com.reachonline.backend.release;

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
class ReleaseReviewControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private GovernancePolicyRepository governancePolicyRepository;

    @Autowired
    private ReleaseReviewRepository releaseReviewRepository;

    @BeforeEach
    void cleanDatabase() {
        releaseReviewRepository.deleteAll();
        governancePolicyRepository.deleteAll();
        contractRepository.deleteAll();
    }

    @Test
    void shouldCreateListAndRetrieveCompleteReleaseReview() throws Exception {
        createContract("1.2.0", """
                {
                  "name": "reviewable_tool",
                  "input": {"required": ["query"]}
                }
                """);
        createContract("1.3.0", """
                {
                  "name": "reviewable_tool",
                  "input": {"required": ["query", "limit"]}
                }
                """);

        String response = mockMvc.perform(post("/api/release-reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "contractName": "reviewable_tool",
                                  "fromVersion": "1.2.0",
                                  "proposedVersion": "1.3.0"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contractName").value("reviewable_tool"))
                .andExpect(jsonPath("$.baselineVersion").value("1.2.0"))
                .andExpect(jsonPath("$.proposedVersion").value("1.3.0"))
                .andExpect(jsonPath("$.status").value("PASS"))
                .andExpect(jsonPath("$.findings.impact.changedPathCount").value(1))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String reviewId = response.replaceFirst(".*\"id\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(get("/api/release-reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].baselineVersion").value("1.2.0"));

        mockMvc.perform(get("/api/release-reviews/" + reviewId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contractName").value("reviewable_tool"))
                .andExpect(jsonPath("$.findings.governance.decision").value("PASS"));
    }

    private void createContract(String version, String content)
            throws Exception {
        mockMvc.perform(post("/api/contracts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "reviewable_tool",
                                  "contractType": "MCP_TOOL",
                                  "version": "%s",
                                  "content": %s
                                }
                                """.formatted(version, content)))
                .andExpect(status().isCreated());
    }
}
