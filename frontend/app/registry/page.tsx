
"use client";

import {
  Activity,
  AlertCircle,
  Boxes,
  FileText,
  GitBranch,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  apiRequest,
  ApiError,
  unwrapApiResponse,
  type ApiResponse,
} from "@/lib/api";
import {
  DependencyGraph,
  type GraphAgent,
  type GraphDependency,
  type GraphTool,
} from "@/components/dependency-graph";

type Agent = GraphAgent & {
  id?: string | number;
  description?: string;
  agentType?: string;
};

type Tool = GraphTool & {
  id?: string | number;
  description?: string;
  endpoint?: string;
};

type Dependency = GraphDependency & {
  id?: string | number;
  consumerExpectations?: string;
};

type BackendDependency = {
  id?: string | number;
  agent?: Agent;
  tool?: Tool;
  agentName?: string;
  toolName?: string;
  consumerExpectations?: string;
};

type Contract = {
  id?: string | number;
  name: string;
  contractType?: string;
  version: string;
};

type Policy = {
  id: string | number;
  name: string;
  description?: string;
  ruleType: string;
  configuration?: unknown;
  enabled: boolean;
};

type Tab =
  | "agents"
  | "tools"
  | "dependencies"
  | "contracts"
  | "policies"
  | "graph";

const tabs: {
  id: Tab;
  label: string;
  icon: typeof Boxes;
  iconColor: string;
  iconBackground: string;
}[] = [
  {
    id: "agents",
    label: "Agents",
    icon: Boxes,
    iconColor: "text-violet-500",
    iconBackground: "#09090b",
  },
  {
    id: "tools",
    label: "Tools",
    icon: Wrench,
    iconColor: "text-sky-500",
    iconBackground: "#0c0c0d",
  },
  {
    id: "dependencies",
    label: "Dependencies",
    icon: GitBranch,
    iconColor: "text-amber-500",
    iconBackground: "#09090b",
  },
  {
    id: "contracts",
    label: "Contracts",
    icon: FileText,
    iconColor: "text-rose-500",
    iconBackground: "#09090b",
  },
  {
    id: "policies",
    label: "Policies",
    icon: ShieldCheck,
    iconColor: "text-emerald-500",
    iconBackground: "#09090b",
  },
  {
    id: "graph",
    label: "Dependency graph",
    icon: Activity,
    iconColor: "text-cyan-500",
    iconBackground: "#09090b",
  },
];

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-sm border border-red-500/30 bg-red-500/5 p-3 text-sm"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
      <span>{message}</span>
    </div>
  );
}

function EmptyMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-sm border border-dashed border-[var(--border-strong)] p-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[var(--muted)]">
        {description}
      </p>
    </div>
  );
}

function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-sm border border-[var(--border)]">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="bg-[var(--surface-secondary)]">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-xs font-medium text-[var(--muted)]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">{children}</tbody>
      </table>
    </div>
  );
}

function Cell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="max-w-[360px] break-words px-4 py-3 align-top text-sm">
      {children}
    </td>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-[var(--muted-foreground)]">
        {label}
      </span>
      <input
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-sm border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--focus-ring)]"
      />
    </label>
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "The operation could not be completed.";
}

function normalizeDependency(dependency: BackendDependency): Dependency {
  return {
    id: dependency.id,
    agentName: dependency.agent?.name ?? dependency.agentName ?? "Unknown agent",
    toolName: dependency.tool?.name ?? dependency.toolName ?? "Unknown tool",
    consumerExpectations: dependency.consumerExpectations,
  };
}

export default function RegistryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("agents");


  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const requestedTab = params.get("tab");

  const validTabs: Tab[] = [
    "agents",
    "tools",
    "dependencies",
    "contracts",
    "policies",
    "graph",
  ];

  if (
    requestedTab &&
    validTabs.includes(requestedTab as Tab)
  ) {
    void Promise.resolve().then(() => {
      setActiveTab(requestedTab as Tab);
    });
  }
}, []);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [available, setAvailable] = useState({
    agents: false,
    tools: false,
    dependencies: false,
    contracts: false,
    policies: false,
  });

  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [agentType, setAgentType] = useState("GENERAL");

  const [toolName, setToolName] = useState("");
  const [toolDescription, setToolDescription] = useState("");
  const [toolProtocol, setToolProtocol] = useState("MCP");
  const [toolEndpoint, setToolEndpoint] = useState("");

  const [dependencyAgent, setDependencyAgent] = useState("");
  const [dependencyTool, setDependencyTool] = useState("");
  const [expectations, setExpectations] = useState("{}");

  const [policyName, setPolicyName] = useState("");
  const [policyDescription, setPolicyDescription] = useState("");
  const [policyRule, setPolicyRule] = useState("WARN_ON_ANY_CHANGE");
  const [policyConfiguration, setPolicyConfiguration] = useState("{}");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      apiRequest<ApiResponse<Agent[]>>("/api/registry/agents"),
      apiRequest<ApiResponse<Tool[]>>("/api/registry/tools"),
      apiRequest<ApiResponse<BackendDependency[]>>(
        "/api/registry/dependencies",
      ),
      apiRequest<Contract[]>("/api/contracts"),
      apiRequest<Policy[]>("/api/governance/policies"),
    ]);

    const [agentResult, toolResult, dependencyResult, contractResult, policyResult] =
      results;

    const errors: string[] = [];

    if (agentResult.status === "fulfilled") {
      setAgents(unwrapApiResponse(agentResult.value));
    } else {
      errors.push(`Agents: ${errorMessage(agentResult.reason)}`);
    }

    if (toolResult.status === "fulfilled") {
      setTools(unwrapApiResponse(toolResult.value));
    } else {
      errors.push(`Tools: ${errorMessage(toolResult.reason)}`);
    }

    if (dependencyResult.status === "fulfilled") {
      setDependencies(
        unwrapApiResponse<BackendDependency[]>(dependencyResult.value).map(
          normalizeDependency,
        ),
      );
    } else {
      errors.push(`Dependencies: ${errorMessage(dependencyResult.reason)}`);
    }

    if (contractResult.status === "fulfilled") {
      setContracts(contractResult.value);
    } else {
      errors.push(`Contracts: ${errorMessage(contractResult.reason)}`);
    }

    if (policyResult.status === "fulfilled") {
      setPolicies(policyResult.value);
    } else {
      errors.push(`Policies: ${errorMessage(policyResult.reason)}`);
    }

    setAvailable((previous) => ({
      agents: agentResult.status === "fulfilled" || previous.agents,
      tools: toolResult.status === "fulfilled" || previous.tools,
      dependencies:
        dependencyResult.status === "fulfilled" || previous.dependencies,
      contracts: contractResult.status === "fulfilled" || previous.contracts,
      policies: policyResult.status === "fulfilled" || previous.policies,
    }));

    if (errors.length > 0) {
      setError(errors.join(" "));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  async function submitAction(
    action: () => Promise<void>,
    successMessage: string,
  ) {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await action();
      setNotice(successMessage);
      await loadData();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The operation could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function createAgent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await submitAction(async () => {
      await apiRequest("/api/registry/agents", {
        method: "POST",
        body: JSON.stringify({
          name: agentName.trim(),
          description: agentDescription.trim(),
          agentType: agentType.trim(),
        }),
      });

      setAgentName("");
      setAgentDescription("");
      setAgentType("GENERAL");
    }, "Agent registered successfully.");
  }

  async function createTool(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await submitAction(async () => {
      await apiRequest("/api/registry/tools", {
        method: "POST",
        body: JSON.stringify({
          name: toolName.trim(),
          description: toolDescription.trim(),
          protocol: toolProtocol.trim(),
          endpoint: toolEndpoint.trim(),
        }),
      });

      setToolName("");
      setToolDescription("");
      setToolProtocol("MCP");
      setToolEndpoint("");
    }, "Tool registered successfully.");
  }

  async function createDependency(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let parsedExpectations: unknown;

    try {
      parsedExpectations = JSON.parse(expectations);
    } catch {
      setError("Consumer expectations must contain valid JSON.");
      return;
    }

    await submitAction(async () => {
      await apiRequest("/api/registry/dependencies", {
        method: "POST",
        body: JSON.stringify({
          agentName: dependencyAgent,
          toolName: dependencyTool,
          consumerExpectations: JSON.stringify(parsedExpectations),
        }),
      });

      setExpectations("{}");
    }, "Dependency registered successfully.");
  }

  async function createPolicy(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let parsedConfiguration: unknown;

    try {
      parsedConfiguration = JSON.parse(policyConfiguration);
    } catch {
      setError("Policy configuration must contain valid JSON.");
      return;
    }

    await submitAction(async () => {
      await apiRequest("/api/governance/policies", {
        method: "POST",
        body: JSON.stringify({
          name: policyName.trim(),
          description: policyDescription.trim(),
          ruleType: policyRule,
          configuration: JSON.stringify(parsedConfiguration),
          enabled: true,
        }),
      });

      setPolicyName("");
      setPolicyDescription("");
      setPolicyRule("WARN_ON_ANY_CHANGE");
      setPolicyConfiguration("{}");
    }, "Governance policy created successfully.");
  }

  async function togglePolicy(policy: Policy) {
    if (policy.id === undefined || policy.id === null) {
      setError(`Policy "${policy.name}" has no ID; it cannot be updated.`);
      return;
    }

    await submitAction(async () => {
      await apiRequest(
        `/api/governance/policies/${encodeURIComponent(String(policy.id))}/enabled?enabled=${!policy.enabled}`,
        { method: "PATCH" },
      );
    }, `Policy "${policy.name}" updated.`);
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-7">
      <header className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-sm border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted-foreground)]">
            <Boxes className="size-3.5" />
            Platform registry
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Agent & tool registry
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
            Manage registered agents, tools, their dependencies, contract
            versions and governance policies.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading || busy}
          className="inline-flex items-center justify-center gap-2 rounded-sm border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface-hover)] disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh registry
        </button>
      </header>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {[
          {
            label: "Agents",
            count: available.agents ? agents.length : "—",
          },
          { label: "Tools", count: available.tools ? tools.length : "—" },
          {
            label: "Dependencies",
            count: available.dependencies ? dependencies.length : "—",
          },
          {
            label: "Contracts",
            count: available.contracts ? contracts.length : "—",
          },
          {
            label: "Policies",
            count: available.policies ? policies.length : "—",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-sm border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <p className="text-xs text-[var(--muted)]">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {loading ? "—" : item.count}
            </p>
          </div>
        ))}
      </section>

      {error && <ErrorMessage message={error} />}
      {notice && (
        <div
          role="status"
          className="rounded-sm border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300"
        >
          {notice}
        </div>
      )}

      <section className="overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--surface)]">
        <div className="app-scrollbar flex gap-1 overflow-x-auto border-b border-[var(--border)] p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={active}
                className={`inline-flex shrink-0 items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-[var(--surface-hover)] font-medium text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)]"
                }`}
              >
                <span
  className={`flex size-8 shrink-0 items-center justify-center rounded-md ${tab.iconBackground}`}
>
  <Icon className={`size-4 ${tab.iconColor}`} />
</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-[var(--muted)]">
              <LoaderCircle className="size-4 animate-spin" />
              Loading registry data…
            </div>
          ) : (
            <>
              {activeTab === "agents" && (
                <>
                  <div>
                    <h2 className="text-lg font-semibold">Registered agents</h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Agent names must match the identifiers used by dependency records.
                    </p>
                  </div>

                  {!available.agents ? (
                    <EmptyMessage
                      title="Agents are unavailable"
                      description="The agent list request failed. Use Refresh registry to retry."
                    />
                  ) : agents.length === 0 ? (
                    <EmptyMessage
                      title="No agents registered"
                      description="Use the form below to register the first agent."
                    />
                  ) : (
                    <DataTable headers={["Name", "Type", "Description", "ID"]}>
                      {agents.map((agent, index) => (
                        <tr key={agent.id ?? agent.name ?? index}>
                          <Cell>{agent.name}</Cell>
                          <Cell>{agent.agentType ?? "—"}</Cell>
                          <Cell>{agent.description ?? "—"}</Cell>
                          <Cell>{agent.id ?? "—"}</Cell>
                        </tr>
                      ))}
                    </DataTable>
                  )}

                  <form onSubmit={createAgent} className="space-y-4 rounded-sm border border-[var(--border)] p-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Plus className="size-4" />
                      Register an agent
                    </h3>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Field label="Name" value={agentName} onChange={setAgentName} placeholder="Course Assistant" required />
                      <Field label="Agent type" value={agentType} onChange={setAgentType} placeholder="GENERAL" required />
                      <Field label="Description" value={agentDescription} onChange={setAgentDescription} placeholder="What this agent does" />
                    </div>
                    <button disabled={busy} className="rounded-sm bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-50">
                      {busy ? "Saving…" : "Register agent"}
                    </button>
                  </form>
                </>
              )}

              {activeTab === "tools" && (
                <>
                  <h2 className="text-lg font-semibold">Registered tools</h2>
                  {!available.tools ? (
                    <EmptyMessage
                      title="Tools are unavailable"
                      description="The tool list request failed. Use Refresh registry to retry."
                    />
                  ) : tools.length === 0 ? (
                    <EmptyMessage title="No tools registered" description="Register a tool to make it available for agent dependency mapping." />
                  ) : (
                    <DataTable headers={["Name", "Protocol", "Endpoint", "Description"]}>
                      {tools.map((tool, index) => (
                        <tr key={tool.id ?? tool.name ?? index}>
                          <Cell>{tool.name}</Cell>
                          <Cell>{tool.protocol ?? "—"}</Cell>
                          <Cell>{tool.endpoint ?? "—"}</Cell>
                          <Cell>{tool.description ?? "—"}</Cell>
                        </tr>
                      ))}
                    </DataTable>
                  )}

                  <form onSubmit={createTool} className="space-y-4 rounded-sm border border-[var(--border)] p-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Plus className="size-4" />
                      Register a tool
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Name" value={toolName} onChange={setToolName} placeholder="course_tool" required />
                      <Field label="Protocol" value={toolProtocol} onChange={setToolProtocol} placeholder="MCP" required />
                      <Field label="Endpoint" value={toolEndpoint} onChange={setToolEndpoint} placeholder="https://example.com/mcp" required />
                      <Field label="Description" value={toolDescription} onChange={setToolDescription} placeholder="Tool description" />
                    </div>
                    <button disabled={busy} className="rounded-sm bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-50">
                      {busy ? "Saving…" : "Register tool"}
                    </button>
                  </form>
                </>
              )}

              {activeTab === "dependencies" && (
                <>
                  <h2 className="text-lg font-semibold">Agent-tool dependencies</h2>
                  {!available.dependencies ? (
                    <EmptyMessage
                      title="Dependencies are unavailable"
                      description="The dependency list request failed. Use Refresh registry to retry."
                    />
                  ) : dependencies.length === 0 ? (
                    <EmptyMessage title="No dependencies registered" description="Create a dependency to record which tool an agent consumes." />
                  ) : (
                    <DataTable headers={["Agent", "Tool", "Consumer expectations"]}>
                      {dependencies.map((dependency, index) => (
                        <tr key={dependency.id ?? `${dependency.agentName}-${dependency.toolName}-${index}`}>
                          <Cell>{dependency.agentName}</Cell>
                          <Cell>{dependency.toolName}</Cell>
                          <Cell>
                            <pre className="whitespace-pre-wrap break-words text-xs">{dependency.consumerExpectations ?? "—"}</pre>
                          </Cell>
                        </tr>
                      ))}
                    </DataTable>
                  )}

                  <form onSubmit={createDependency} className="space-y-4 rounded-sm border border-[var(--border)] p-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Plus className="size-4" />
                      Register a dependency
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-[var(--muted-foreground)]">Agent</span>
                        <select required value={dependencyAgent} onChange={(event) => setDependencyAgent(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm">
                          <option value="">Select agent</option>
                          {agents.map((agent) => <option key={agent.name} value={agent.name}>{agent.name}</option>)}
                        </select>
                      </label>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-[var(--muted-foreground)]">Tool</span>
                        <select required value={dependencyTool} onChange={(event) => setDependencyTool(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm">
                          <option value="">Select tool</option>
                          {tools.map((tool) => <option key={tool.name} value={tool.name}>{tool.name}</option>)}
                        </select>
                      </label>
                    </div>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-[var(--muted-foreground)]">Consumer expectations (JSON)</span>
                      <textarea value={expectations} onChange={(event) => setExpectations(event.target.value)} rows={4} required className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] p-3 font-mono text-xs outline-none focus:border-[var(--focus-ring)]" />
                    </label>
                    <button disabled={busy || agents.length === 0 || tools.length === 0} className="rounded-sm bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-50">
                      {busy ? "Saving…" : "Register dependency"}
                    </button>
                  </form>
                </>
              )}

              {activeTab === "contracts" && (
                <>
                  <h2 className="text-lg font-semibold">Registered contracts</h2>
                  {!available.contracts ? (
                    <EmptyMessage
                      title="Contracts are unavailable"
                      description="The contract list request failed. Use Refresh registry to retry."
                    />
                  ) : contracts.length === 0 ? (
                    <EmptyMessage title="No contracts found" description="Contracts created through the backend API will appear here." />
                  ) : (
                    <DataTable headers={["Name", "Version", "Type", "ID"]}>
                      {contracts.map((contract, index) => (
                        <tr key={contract.id ?? `${contract.name}-${contract.version}-${index}`}>
                          <Cell>{contract.name}</Cell>
                          <Cell>{contract.version}</Cell>
                          <Cell>{contract.contractType ?? "—"}</Cell>
                          <Cell>{contract.id ?? "—"}</Cell>
                        </tr>
                      ))}
                    </DataTable>
                  )}
                  <p className="text-xs leading-5 text-[var(--muted)]">
                    Contract creation and version comparison remain available through Contract Review and the existing contract API. This registry tab is read-only in this step.
                  </p>
                </>
              )}

              {activeTab === "policies" && (
                <>
                  <h2 className="text-lg font-semibold">Governance policies</h2>
                  {!available.policies ? (
                    <EmptyMessage
                      title="Policies are unavailable"
                      description="The policy list request failed. Use Refresh registry to retry."
                    />
                  ) : policies.length === 0 ? (
                    <EmptyMessage title="No policies registered" description="Create a policy using the form below." />
                  ) : (
                    <DataTable headers={["Policy", "Rule type", "Status", "Description", "Action"]}>
                      {policies.map((policy, index) => (
                        <tr key={policy.id ?? `${policy.name}-${index}`}>
                          <Cell>{policy.name}</Cell>
                          <Cell>{policy.ruleType}</Cell>
                          <Cell>
                            <span className={`rounded-md border px-2 py-1 text-xs ${policy.enabled ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "border-[var(--border)] text-[var(--muted)]"}`}>
                              {policy.enabled ? "Enabled" : "Disabled"}
                            </span>
                          </Cell>
                          <Cell>{policy.description ?? "—"}</Cell>
                          <Cell>
                            <button type="button" disabled={busy} onClick={() => void togglePolicy(policy)} className="rounded-sm border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium hover:bg-[var(--surface-hover)] disabled:opacity-50">
                              {policy.enabled ? "Disable" : "Enable"}
                            </button>
                          </Cell>
                        </tr>
                      ))}
                    </DataTable>
                  )}

                  <form onSubmit={createPolicy} className="space-y-4 rounded-sm border border-[var(--border)] p-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Plus className="size-4" />
                      Create governance policy
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Name" value={policyName} onChange={setPolicyName} placeholder="Warn on contract changes" required />
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-[var(--muted-foreground)]">Rule type</span>
                        <select value={policyRule} onChange={(event) => setPolicyRule(event.target.value)} className="w-full rounded-sm border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm">
                          <option value="BLOCK_ON_ANY_REMOVAL">BLOCK_ON_ANY_REMOVAL</option>
                          <option value="BLOCK_REMOVED_PROTECTED_PATH">BLOCK_REMOVED_PROTECTED_PATH</option>
                          <option value="WARN_ON_ANY_CHANGE">WARN_ON_ANY_CHANGE</option>
                        </select>
                      </label>
                      <Field label="Description" value={policyDescription} onChange={setPolicyDescription} placeholder="Explain what the policy checks" />
                    </div>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-[var(--muted-foreground)]">Configuration (JSON)</span>
                      <textarea value={policyConfiguration} onChange={(event) => setPolicyConfiguration(event.target.value)} rows={3} required className="w-full rounded-sm border border-[var(--border)] bg-[var(--background)] p-3 font-mono text-xs outline-none focus:border-[var(--focus-ring)]" />
                    </label>
                    <button disabled={busy} className="rounded-sm bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-50">
                      {busy ? "Saving…" : "Create policy"}
                    </button>
                  </form>
                </>
              )}

              {activeTab === "graph" && (
                <>
                  <div>
                    <h2 className="text-lg font-semibold">Dependency graph</h2>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      Each edge represents a registered agent-to-tool dependency.
                      Use the graph controls to zoom and pan.
                    </p>
                  </div>
                  <DependencyGraph
                    agents={agents}
                    tools={tools}
                    dependencies={dependencies}
                  />
                  <p className="text-xs text-[var(--muted)]">
                    {agents.length} agents · {tools.length} tools · {dependencies.length} dependency records
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
