
package com.reachonline.backend.contracts.controller;

import com.reachonline.backend.contracts.ContractService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts")
public class ContractController {

    private final ContractService contractService;

    public ContractController(ContractService contractService) {
        this.contractService = contractService;
    }

    @PostMapping
    public ResponseEntity<ContractResponse> create(
        @Valid @RequestBody CreateContractRequest request
    ) {
        ContractResponse response = contractService.create(request);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(response);
    }

    @GetMapping
    public List<ContractResponse> findAll() {
        return contractService.findAll();
    }

    @GetMapping("/{name}/versions")
    public List<ContractResponse> findVersions(
        @PathVariable String name
    ) {
        return contractService.findVersions(name);
    }

    @GetMapping("/{name}/versions/{version}")
    public ContractResponse findVersion(
        @PathVariable String name,
        @PathVariable String version
    ) {
        return contractService.findVersion(name, version);
    }
}
