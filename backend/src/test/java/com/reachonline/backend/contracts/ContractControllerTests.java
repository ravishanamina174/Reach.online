
package com.reachonline.backend.contracts;

import tools.jackson.databind.json.JsonMapper;
import com.reachonline.backend.contracts.controller.CreateContractRequest;
import com.reachonline.backend.contracts.repository.ContractRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ContractControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper objectMapper;

    @Autowired
    private ContractRepository contractRepository;

    @BeforeEach
    void cleanDatabase() {
    contractRepository.deleteAll();
    }

    @Test
    void shouldCreateAndRetrieveContractVersion() throws Exception {
        String request = """
            {
              "name": "get_timetable",
              "contractType": "MCP_TOOL",
              "version": "1.0.0",
              "content": {
                "name": "get_timetable",
                "inputSchema": {
                  "type": "object",
                  "properties": {
                    "studentId": {"type": "string"}
                  },
                  "required": ["studentId"]
                }
              }
            }
            """;

        mockMvc.perform(post("/api/contracts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("get_timetable"))
            .andExpect(jsonPath("$.version").value("1.0.0"))
            .andExpect(jsonPath("$.content.name").value("get_timetable"));

        mockMvc.perform(
                get("/api/contracts/get_timetable/versions/1.0.0")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.contractType").value("MCP_TOOL"))
            .andExpect(jsonPath("$.content.inputSchema.type").value("object"));
    }

    @Test
    void shouldRejectDuplicateContractVersion() throws Exception {
        String request = """
            {
              "name": "get_course_details",
              "contractType": "MCP_TOOL",
              "version": "1.0.0",
              "content": {"name": "get_course_details"}
            }
            """;

        mockMvc.perform(post("/api/contracts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isCreated());

        mockMvc.perform(post("/api/contracts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isConflict());
    }

    @Test
    void shouldRejectEmptyContractContent() throws Exception {
        String request = """
            {
              "name": "invalid_contract",
              "contractType": "OPENAPI",
              "version": "1.0.0",
              "content": {}
            }
            """;

        mockMvc.perform(post("/api/contracts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnNotFoundForUnknownVersion() throws Exception {
        mockMvc.perform(
                get("/api/contracts/unknown_tool/versions/9.9.9")
            )
            .andExpect(status().isNotFound());
    }
}
