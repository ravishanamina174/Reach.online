
package com.reachonline.backend.registry.controller;

import com.reachonline.backend.common.api.ApiResponse;
import com.reachonline.backend.registry.model.Agent;
import com.reachonline.backend.registry.model.AgentToolDependency;
import com.reachonline.backend.registry.model.Tool;
import com.reachonline.backend.registry.repository.AgentRepository;
import com.reachonline.backend.registry.repository.AgentToolDependencyRepository;
import com.reachonline.backend.registry.repository.ToolRepository;

import jakarta.validation.Valid;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/registry/dependencies")
public class DependencyController {

    private final AgentRepository agentRepository;
    private final ToolRepository toolRepository;
    private final AgentToolDependencyRepository dependencyRepository;

    public DependencyController(
            AgentRepository agentRepository,
            ToolRepository toolRepository,
            AgentToolDependencyRepository dependencyRepository
    ) {
        this.agentRepository = agentRepository;
        this.toolRepository = toolRepository;
        this.dependencyRepository = dependencyRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<List<AgentToolDependency>> listDependencies() {
        return ApiResponse.of(dependencyRepository.findAll());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<AgentToolDependency>> createDependency(
            @Valid @RequestBody CreateDependencyRequest request
    ) {
        Agent agent = agentRepository
                .findByNameIgnoreCase(request.agentName().trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Registered agent was not found"
                ));

        Tool tool = toolRepository
                .findByNameIgnoreCase(request.toolName().trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Registered tool was not found"
                ));

        boolean alreadyExists = dependencyRepository
                .findByToolNameWithAgent(tool.getName())
                .stream()
                .anyMatch(dependency ->
                        dependency.getAgent().getId().equals(agent.getId())
                );

        if (alreadyExists) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This agent-to-tool dependency already exists"
            );
        }

        AgentToolDependency dependency = new AgentToolDependency(
                agent,
                tool,
                request.consumerExpectations().trim()
        );

        try {
            AgentToolDependency saved = dependencyRepository.saveAndFlush(
                    dependency
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.of(saved));
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This agent-to-tool dependency already exists"
            );
        }
    }
}
