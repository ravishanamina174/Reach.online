
package com.reachonline.backend.contracts;

import com.reachonline.backend.contracts.controller.ContractDiffResponse;
import com.reachonline.backend.contracts.controller.ContractImpactResponse;
import com.reachonline.backend.contracts.controller.ContractImpactResponse.AgentImpact;
import com.reachonline.backend.registry.model.AgentToolDependency;
import com.reachonline.backend.registry.repository.AgentToolDependencyRepository;
import com.reachonline.backend.registry.repository.ToolRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ContractImpactService {

    private final ContractDiffService contractDiffService;
    private final ToolRepository toolRepository;
    private final AgentToolDependencyRepository dependencyRepository;

    public ContractImpactService(
            ContractDiffService contractDiffService,
            ToolRepository toolRepository,
            AgentToolDependencyRepository dependencyRepository
    ) {
        this.contractDiffService = contractDiffService;
        this.toolRepository = toolRepository;
        this.dependencyRepository = dependencyRepository;
    }

    @Transactional(readOnly = true)
    public ContractImpactResponse analyze(
            String contractName,
            String fromVersion,
            String toVersion
    ) {
        ContractDiffResponse diff = contractDiffService.compare(
                contractName,
                fromVersion,
                toVersion
        );

        boolean toolRegistered =
                toolRepository.existsByNameIgnoreCase(contractName);

        if (!diff.hasChanges()) {
            return new ContractImpactResponse(
                    contractName,
                    fromVersion,
                    toVersion,
                    false,
                    toolRegistered,
                    "NO_CHANGES",
                    0,
                    0,
                    diff.changes(),
                    List.of(),
                    "The contract versions are equivalent. No dependent agents require impact review."
            );
        }

        if (!toolRegistered) {
            return new ContractImpactResponse(
                    contractName,
                    fromVersion,
                    toVersion,
                    true,
                    false,
                    "TOOL_NOT_REGISTERED",
                    diff.changes().size(),
                    0,
                    diff.changes(),
                    List.of(),
                    "Contract changes were detected, but no registered tool matches the contract name. Register or associate the tool before assessing dependent agents."
            );
        }

        List<AgentToolDependency> dependencies =
                dependencyRepository.findByToolNameWithAgent(contractName);

        List<String> changedPaths = diff.changes()
                .stream()
                .map(ContractDiffResponse.Change::path)
                .distinct()
                .toList();

        List<AgentImpact> impacts = dependencies.stream()
                .map(dependency -> new AgentImpact(
                        dependency.getAgent().getId(),
                        dependency.getAgent().getName(),
                        dependency.getAgent().getAgentType(),
                        dependency.getAgent().getStatus(),
                        dependency.getTool().getId(),
                        dependency.getTool().getName(),
                        dependency.getTool().getStatus(),
                        dependency.getConsumerExpectations(),
                        changedPaths,
                        "This agent depends on the tool associated with the changed contract. The changed paths are potential impact areas; consumer expectations must be checked to determine actual compatibility."
                ))
                .toList();

        String summary;

        if (impacts.isEmpty()) {
            summary = "Contract changes were detected, but no agent-to-tool dependencies are registered for this tool.";
        } else {
            summary = "Contract changes were detected across "
                    + changedPaths.size()
                    + " changed paths. "
                    + impacts.size()
                    + " registered agent-to-tool dependencies may be affected. This is a potential-impact assessment, not a final compatibility decision.";
        }

        return new ContractImpactResponse(
                contractName,
                fromVersion,
                toVersion,
                true,
                true,
                impacts.isEmpty()
                        ? "NO_DEPENDENCIES"
                        : "IMPACT_DETECTED",
                changedPaths.size(),
                impacts.size(),
                diff.changes(),
                impacts,
                summary
        );
    }
}
