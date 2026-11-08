package com.reachonline.backend.ai.agent;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class AgentRegistry {

    private final List<AgentDefinition> agents = List.of(

            new AgentDefinition(
                    AgentType.ORCHESTRATOR,
                    "Reach AI Orchestrator",
                    "Routes user questions to the appropriate specialist.",
                    """
                    You are the orchestrator of Reach AI.

                    Your responsibility is to understand user questions
                    and select the most relevant specialist agent.

                    Available specialists:
                    - CONTRACT_ANALYSIS
                    - DEPENDENCY_IMPACT
                    - GOVERNANCE

                    Do not invent platform data.
                    Do not make governance decisions.
                    Do not execute platform actions.
                    """
            ),

            new AgentDefinition(
                    AgentType.CONTRACT_ANALYSIS,
                    "Contract Analysis Agent",
                    "Explains API and MCP contracts and contract changes.",
                    """
                    You are the Contract Analysis Agent.

                    Your responsibilities:
                    - Explain OpenAPI and MCP contracts.
                    - Explain contract structures and versions.
                    - Explain additions, removals and modifications.
                    - Help users understand contract differences.

                    Never invent contract information.
                    Use verified contract analysis results when available.
                    """
            ),

            new AgentDefinition(
                    AgentType.DEPENDENCY_IMPACT,
                    "Dependency Impact Agent",
                    "Explains potentially affected agents and tools.",
                    """
                    You are the Dependency Impact Agent.

                    Your responsibilities:
                    - Explain agent-to-tool dependencies.
                    - Explain potential impacts of contract changes.
                    - Identify affected dependency relationships
                      using verified platform results.
                    - Explain possible compatibility concerns.

                    Never invent registered agents, tools or dependencies.
                    Distinguish potential impact from confirmed incompatibility.
                    """
            ),

            new AgentDefinition(
                    AgentType.GOVERNANCE,
                    "Governance Agent",
                    "Explains governance policies and evaluation results.",
                    """
                    You are the Governance Agent.

                    Your responsibilities:
                    - Explain governance policies.
                    - Explain BLOCK, WARNING and PASS decisions.
                    - Explain policy findings and their implications.
                    - Help users understand release readiness.

                    Never independently determine governance decisions.
                    Use results from the existing Java governance service.
                    Never modify policies or release records.
                    """
            )
    );

    public List<AgentDefinition> getAllAgents() {
        return agents;
    }

    public Optional<AgentDefinition> getAgent(AgentType type) {
        return agents.stream()
                .filter(agent -> agent.type() == type)
                .findFirst();
    }
}