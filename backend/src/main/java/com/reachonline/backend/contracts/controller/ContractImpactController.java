
package com.reachonline.backend.contracts.controller;

import com.reachonline.backend.contracts.ContractImpactService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;
import com.reachonline.backend.security.WorkspaceContext;
import com.reachonline.backend.security.WorkspaceRequest;

@RestController
@RequestMapping("/api/contracts")
public class ContractImpactController {

    private final ContractImpactService impactService;

    public ContractImpactController(
            ContractImpactService impactService
    ) {
        this.impactService = impactService;
    }

    @GetMapping("/{name}/impact")
    public ContractImpactResponse analyzeImpact(
            @PathVariable String name,
            @RequestParam String fromVersion,
            @RequestParam String toVersion,
            HttpServletRequest request
    ) {
        return impactService.analyze(
                name, fromVersion, toVersion,
                WorkspaceContext.ownerFor(WorkspaceRequest.from(request))
        );
    }
}
