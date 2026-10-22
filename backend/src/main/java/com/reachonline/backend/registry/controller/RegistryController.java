package com.reachonline.backend.registry.controller;

import com.reachonline.backend.common.api.ApiResponse;
import com.reachonline.backend.registry.model.Agent;
import com.reachonline.backend.registry.model.Tool;
import com.reachonline.backend.registry.repository.AgentRepository;
import com.reachonline.backend.registry.repository.ToolRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registry")
public class RegistryController {

    private final AgentRepository agentRepository;
    private final ToolRepository toolRepository;

    public RegistryController(
            AgentRepository agentRepository,
            ToolRepository toolRepository
    ) {
        this.agentRepository = agentRepository;
        this.toolRepository = toolRepository;
    }

    @GetMapping("/agents")
    public ApiResponse<List<Agent>> listAgents() {
        return ApiResponse.of(agentRepository.findAll());
    }

    @PostMapping("/agents")
    public ResponseEntity<ApiResponse<Agent>> createAgent(
            @Valid @RequestBody CreateAgentRequest request
    ) {
        Agent agent = new Agent(
                request.name().trim(),
                request.description(),
                request.agentType().trim()
        );

        Agent saved = agentRepository.save(agent);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(saved));
    }

    @GetMapping("/tools")
    public ApiResponse<List<Tool>> listTools() {
        return ApiResponse.of(toolRepository.findAll());
    }

    @PostMapping("/tools")
    public ResponseEntity<ApiResponse<Tool>> createTool(
            @Valid @RequestBody CreateToolRequest request
    ) {
        Tool tool = new Tool(
                request.name().trim(),
                request.description(),
                request.protocol().trim(),
                request.endpoint()
        );

        Tool saved = toolRepository.save(tool);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(saved));
    }
}