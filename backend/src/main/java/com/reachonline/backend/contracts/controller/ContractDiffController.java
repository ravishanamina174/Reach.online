
package com.reachonline.backend.contracts.controller;

import com.reachonline.backend.contracts.ContractDiffService;

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
public class ContractDiffController {

    private final ContractDiffService diffService;

    public ContractDiffController(ContractDiffService diffService) {
        this.diffService = diffService;
    }

    @GetMapping("/{name}/diff")
    public ContractDiffResponse compareVersions(
            @PathVariable String name,
            @RequestParam String fromVersion,
            @RequestParam String toVersion,
            HttpServletRequest request
    ) {
        return diffService.compare(
                name, fromVersion, toVersion,
                WorkspaceContext.ownerFor(WorkspaceRequest.from(request))
        );
    }
}
