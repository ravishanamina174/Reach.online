
"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useMemo } from "react";

export type GraphAgent = {
  name: string;
  agentType?: string;
};

export type GraphTool = {
  name: string;
  protocol?: string;
};

export type GraphDependency = {
  agentName: string;
  toolName: string;
};

type DependencyGraphProps = {
  agents: GraphAgent[];
  tools: GraphTool[];
  dependencies: GraphDependency[];
};

function GraphNode({
  title,
  subtitle,
  kind,
}: {
  title: string;
  subtitle: string;
  kind: "agent" | "tool";
}) {
  return (
    <div
      className={`min-w-[170px] rounded-xl border bg-[var(--surface)] p-3 shadow-sm ${
        kind === "agent"
          ? "border-[var(--border-strong)]"
          : "border-dashed border-[var(--border-strong)]"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`size-2 rounded-full ${
            kind === "agent" ? "bg-[var(--foreground)]" : "bg-emerald-500"
          }`}
        />
        <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
          {kind}
        </span>
      </div>
      <p className="break-words text-sm font-semibold text-[var(--foreground)]">
        {title}
      </p>
      <p className="mt-1 break-words text-xs text-[var(--muted)]">
        {subtitle || "No additional details"}
      </p>
    </div>
  );
}

export function DependencyGraph({
  agents,
  tools,
  dependencies,
}: DependencyGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const agentNodes: Node[] = agents.map((agent, index) => ({
      id: `agent:${agent.name}`,
      type: "default",
      position: { x: 40, y: 50 + index * 150 },
      data: {
        label: (
          <GraphNode
            title={agent.name}
            subtitle={agent.agentType ?? "Registered agent"}
            kind="agent"
          />
        ),
      },
      style: {
        border: "none",
        background: "transparent",
        padding: 0,
        width: 190,
      },
    }));

    const toolNodes: Node[] = tools.map((tool, index) => ({
      id: `tool:${tool.name}`,
      type: "default",
      position: { x: 390, y: 50 + index * 150 },
      data: {
        label: (
          <GraphNode
            title={tool.name}
            subtitle={tool.protocol ?? "Registered tool"}
            kind="tool"
          />
        ),
      },
      style: {
        border: "none",
        background: "transparent",
        padding: 0,
        width: 190,
      },
    }));

    const validEdges: Edge[] = dependencies
      .filter(
        (dependency) =>
          agents.some((agent) => agent.name === dependency.agentName) &&
          tools.some((tool) => tool.name === dependency.toolName),
      )
      .map((dependency, index) => ({
        id: `dependency-${index}-${dependency.agentName}-${dependency.toolName}`,
        source: `agent:${dependency.agentName}`,
        target: `tool:${dependency.toolName}`,
        animated: false,
        label: "uses",
        labelStyle: {
          fill: "var(--muted-foreground)",
          fontSize: 11,
        },
        style: {
          stroke: "var(--border-strong)",
          strokeWidth: 1.5,
        },
      }));

    return {
      nodes: [...agentNodes, ...toolNodes],
      edges: validEdges,
    };
  }, [agents, tools, dependencies]);

  if (agents.length === 0 && tools.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border-strong)] p-10 text-center">
        <p className="text-sm font-medium">No graph data available</p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Register agents and tools, then add dependencies to visualize their
          relationships.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[540px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
      >
        <Background color="var(--border)" gap={22} />
        <Controls />
        <MiniMap
          pannable
          zoomable
          nodeColor="var(--muted)"
          maskColor="rgba(120,120,120,0.10)"
        />
      </ReactFlow>
    </div>
  );
}
