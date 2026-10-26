
package com.reachonline.backend.contracts.controller;

import com.reachonline.backend.contracts.ContractService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import jakarta.servlet.http.HttpServletRequest;
import com.reachonline.backend.security.WorkspaceContext;
import com.reachonline.backend.security.WorkspaceRequest;

@RestController
@RequestMapping("/api/contracts")
public class ContractController {

    private final ContractService contractService;

    public ContractController(ContractService contractService) {
        this.contractService = contractService;
    }

    @PostMapping
    public ResponseEntity<ContractResponse> create(
        @Valid @RequestBody CreateContractRequest request,
        HttpServletRequest httpRequest
    ) {
        WorkspaceContext.Workspace workspace = WorkspaceRequest.from(httpRequest);
        WorkspaceContext.requireManagement(workspace);
        ContractResponse response = contractService.create(
                request, WorkspaceContext.ownerFor(workspace)
        );

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(response);
    }

    @GetMapping
    public List<ContractResponse> findAll(HttpServletRequest request) {
        return contractService.findAll(WorkspaceContext.ownerFor(WorkspaceRequest.from(request)));
    }

    @GetMapping("/{name}/versions")
    public List<ContractResponse> findVersions(
        @PathVariable String name,
        HttpServletRequest request
    ) {
        return contractService.findVersions(name, WorkspaceContext.ownerFor(WorkspaceRequest.from(request)));
    }

    @GetMapping("/{name}/versions/{version}")
    public ContractResponse findVersion(
        @PathVariable String name,
        @PathVariable String version,
        HttpServletRequest request
    ) {
        return contractService.findVersion(
                name, version, WorkspaceContext.ownerFor(WorkspaceRequest.from(request))
        );
    }
}
