package com.reachonline.backend.registry;

import com.reachonline.backend.registry.model.Agent;
import com.reachonline.backend.registry.model.AgentToolDependency;
import com.reachonline.backend.registry.model.Tool;
import com.reachonline.backend.registry.repository.AgentRepository;
import com.reachonline.backend.registry.repository.AgentToolDependencyRepository;
import com.reachonline.backend.registry.repository.ToolRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RegistryDependencyControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AgentRepository agentRepository;

    @Autowired
    private ToolRepository toolRepository;

    @Autowired
    private AgentToolDependencyRepository dependencyRepository;

    @BeforeEach
    void cleanDatabase() {
        dependencyRepository.deleteAll();
        agentRepository.deleteAll();
        toolRepository.deleteAll();
    }

    @Test
    void shouldReturnDependenciesWithRelationshipsInitialized() throws Exception {
        Agent agent = agentRepository.saveAndFlush(new Agent(
                "Course Assistant",
                "Helps students",
                "LLM_AGENT"
        ));
        Tool tool = toolRepository.saveAndFlush(new Tool(
                "course_tool",
                "Retrieves courses",
                "MCP",
                "http://localhost:3000/mcp"
        ));
        dependencyRepository.saveAndFlush(new AgentToolDependency(
                agent,
                tool,
                "{\"timeoutMs\":1000}"
        ));

        mockMvc.perform(get("/api/registry/dependencies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].agent.name").value("Course Assistant"))
                .andExpect(jsonPath("$.data[0].tool.name").value("course_tool"))
                .andExpect(jsonPath("$.data[0].consumerExpectations")
                        .value("{\"timeoutMs\":1000}"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void shouldReturnEmptyDataWhenNoDependenciesExist() throws Exception {
        mockMvc.perform(get("/api/registry/dependencies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty())
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void shouldCreateAndRetrieveDependency() throws Exception {
        agentRepository.saveAndFlush(new Agent(
                "Course Assistant",
                "Helps students",
                "LLM_AGENT"
        ));
        toolRepository.saveAndFlush(new Tool(
                "course_tool",
                "Retrieves courses",
                "MCP",
                "http://localhost:3000/mcp"
        ));

        String request = """
                {
                  "agentName": "Course Assistant",
                  "toolName": "course_tool",
                  "consumerExpectations": "timeout expectations"
                }
                """;

        mockMvc.perform(post("/api/registry/dependencies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/registry/dependencies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].agent.name").value("Course Assistant"))
                .andExpect(jsonPath("$.data[0].tool.name").value("course_tool"));
    }
}
