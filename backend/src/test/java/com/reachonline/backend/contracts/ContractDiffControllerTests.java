
package com.reachonline.backend.contracts;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.reachonline.backend.contracts.repository.ContractRepository;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ContractDiffControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ContractRepository contractRepository;

    @BeforeEach
    void cleanDatabase() {
        contractRepository.deleteAll();
    }

    private void createContract(String version, String content)
            throws Exception {

        String request = """
                {
                  "name": "course_tool",
                  "contractType": "MCP_TOOL",
                  "version": "%s",
                  "content": %s
                }
                """.formatted(version, content);

        mockMvc.perform(post("/api/contracts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated());
    }

    @Test
    void shouldDetectAddedRemovedAndChangedFields() throws Exception {
        createContract(
                "1.0.0",
                """
                {
                  "name": "course_tool",
                  "description": "Old description",
                  "input": {"required": ["courseId"]}
                }
                """
        );

        createContract(
                "1.1.0",
                """
                {
                  "name": "course_tool",
                  "description": "New description",
                  "timeout": 30,
                  "input": {}
                }
                """
        );

        mockMvc.perform(get("/api/contracts/course_tool/diff")
                        .param("fromVersion", "1.0.0")
                        .param("toVersion", "1.1.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasChanges").value(true))
                .andExpect(jsonPath("$.changes").isArray())
                .andExpect(jsonPath(
                        "$.changes[?(@.path == '/timeout')].type"
                ).value(org.hamcrest.Matchers.contains("ADDED")))
                .andExpect(jsonPath(
                        "$.changes[?(@.path == '/description')].type"
                ).value(org.hamcrest.Matchers.contains("CHANGED")))
                .andExpect(jsonPath(
                        "$.changes[?(@.path == '/input/required')].type"
                ).value(org.hamcrest.Matchers.contains("REMOVED")));
    }

    @Test
    void shouldReturnNoChangesForEquivalentContracts() throws Exception {
        createContract("1.0.0", """
                {"name":"course_tool","enabled":true}
                """);

        createContract("1.1.0", """
                {"enabled":true,"name":"course_tool"}
                """);

        mockMvc.perform(get("/api/contracts/course_tool/diff")
                        .param("fromVersion", "1.0.0")
                        .param("toVersion", "1.1.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasChanges").value(false))
                .andExpect(jsonPath("$.changes").isEmpty());
    }

    @Test
    void shouldReturnNotFoundForUnknownVersion() throws Exception {
        createContract("1.0.0", """
                {"name":"course_tool"}
                """);

        mockMvc.perform(get("/api/contracts/course_tool/diff")
                        .param("fromVersion", "1.0.0")
                        .param("toVersion", "9.9.9"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectComparingSameVersion() throws Exception {
        createContract("1.0.0", """
                {"name":"course_tool"}
                """);

        mockMvc.perform(get("/api/contracts/course_tool/diff")
                        .param("fromVersion", "1.0.0")
                        .param("toVersion", "1.0.0"))
                .andExpect(status().isBadRequest());
    }
}
