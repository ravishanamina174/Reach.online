package com.reachonline.backend.registry.controller;

import com.reachonline.backend.common.api.ApiResponse;
import com.reachonline.backend.registry.model.Agent;
import com.reachonline.backend.registry.model.Tool;
import com.reachonline.backend.registry.repository.AgentRepository;
import com.reachonline.backend.registry.repository.ToolRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import jakarta.servlet.http.HttpServletRequest;
import com.reachonline.backend.security.WorkspaceContext;
import com.reachonline.backend.security.WorkspaceRequest;

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
    public ApiResponse<List<Agent>> listAgents(HttpServletRequest request) {
        WorkspaceContext.Workspace workspace = WorkspaceRequest.from(request);
        return ApiResponse.of(agentRepository.findAllByOwnerUserId(
                WorkspaceContext.ownerFor(workspace)
        ));
    }

    @PostMapping("/agents")
    public ResponseEntity<ApiResponse<Agent>> createAgent(
            @Valid @RequestBody CreateAgentRequest request,
            HttpServletRequest httpRequest
    ) {
        WorkspaceContext.Workspace workspace = WorkspaceRequest.from(httpRequest);
        WorkspaceContext.requireManagement(workspace);
        String owner = WorkspaceContext.ownerFor(workspace);
        if (agentRepository.existsByNameIgnoreCaseAndOwnerUserId(request.name().trim(), owner)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An agent with this name already exists.");
        }
        Agent agent = new Agent(
                request.name().trim(),
                request.description(),
                request.agentType().trim(),
                owner
        );

        Agent saved = agentRepository.save(agent);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(saved));
    }

    @GetMapping("/tools")
    public ApiResponse<List<Tool>> listTools(HttpServletRequest request) {
        WorkspaceContext.Workspace workspace = WorkspaceRequest.from(request);
        return ApiResponse.of(toolRepository.findAllByOwnerUserId(
                WorkspaceContext.ownerFor(workspace)
        ));
    }

    @PostMapping("/tools")
    public ResponseEntity<ApiResponse<Tool>> createTool(
            @Valid @RequestBody CreateToolRequest request,
            HttpServletRequest httpRequest
    ) {
        WorkspaceContext.Workspace workspace = WorkspaceRequest.from(httpRequest);
        WorkspaceContext.requireManagement(workspace);
        String owner = WorkspaceContext.ownerFor(workspace);
        if (toolRepository.existsByNameIgnoreCaseAndOwnerUserId(request.name().trim(), owner)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A tool with this name already exists.");
        }
        Tool tool = new Tool(
                request.name().trim(),
                request.description(),
                request.protocol().trim(),
                request.endpoint(),
                owner
        );

        Tool saved = toolRepository.save(tool);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(saved));
    }
}