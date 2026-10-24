
"use client";

import {
  AlertCircle,
  ArrowDown,
  CheckCircle2,
  ChevronRight,
  FileSearch,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  GitBranch,
  FileCheck2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  apiRequest,
  ApiError,
} from "@/lib/api";

type Contract = {
  id?: string | number;
  name: string;
  contractType?: string;
  version: string;
  content?: string;
  createdAt?: string;
};

type ContractChange = {
  path: string;
  type: string;
  before?: unknown;
  after?: unknown;
};

type ContractDiff = {
  contractName: string;
  fromVersion: string;
  toVersion: string;
  hasChanges: boolean;
  changes: ContractChange[];
};

type AffectedAgent = {
  agentName?: string;
  name?: string;
  [key: string]: unknown;
};

type ContractImpact = {
  contractName: string;
  fromVersion: string;
  toVersion: string;
  hasChanges: boolean;
  toolRegistered?: boolean;
  analysisStatus?: string;
  changedPathCount: number;
  affectedAgentCount: number;
  changes: ContractChange[];
  affectedAgents: AffectedAgent[];
  summary: string;
  [key: string]: unknown;
};

type GovernanceFinding = {
  name?: string;
  policyName?: string;
  ruleType?: string;
  severity?: string;
  message?: string;
  description?: string;
  [key: string]: unknown;
};

type GovernanceResult = {
  contractName: string;
  fromVersion: string;
  toVersion: string;
  decision: string;
  evaluatedPolicyCount: number;
  triggeredPolicyCount: number;
  findings: GovernanceFinding[];
  summary: string;
  evaluatedAt?: string;
};

type GovernancePolicy = {
  id?: string | number;
  name: string;
  description?: string;
  ruleType?: string;
  enabled?: boolean;
};

type ReleaseReview = {
  id: string | number;
  contractName?: string;
  contractId?: string | number;
  proposedVersion: string;
  status: string;
  findings?: unknown;
  createdAt?: string;
  completedAt?: string;
};

type LoadState = "idle" | "loading" | "success" | "error";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}

function prettyValue(value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function displayDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusStyle(status?: string): string {
  const value = (status ?? "").toUpperCase();

  if (value.includes("BLOCK")) {
    return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400";
  }

  if (value.includes("WARN")) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  if (value.includes("PASS") || value.includes("APPROV")) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  return "border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-foreground)]";
}

function StatusPill({ value }: { value?: string }) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle(value)}`}
    >
      {value || "Unknown"}
    </span>
  );
}

function Panel({
  title,
  description,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  description?: string;
  icon: typeof FileSearch;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)]">
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{title}</h2>
            {description && (
              <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                {description}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-secondary)]">
        <FileSearch className="size-4 text-[var(--muted)]" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-md text-xs leading-5 text-[var(--muted-foreground)]">
        {description}
      </p>
    </div>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
      <span className="leading-5">{message}</span>
    </div>
  );
}

function ChangeRow({ change }: { change: ContractChange }) {
  return (
    <div className="min-w-0 space-y-3 rounded-lg border border-[var(--border)] p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <code className="break-all text-xs font-medium">{change.path}</code>
        <StatusPill value={change.type} />
      </div>

      <div className="grid min-w-0 gap-3 md:grid-cols-2">
        <div className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Before
          </p>
          <pre className="app-scrollbar max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5">
            {prettyValue(change.before)}
          </pre>
        </div>

        <div className="min-w-0 rounded-md border border-[var(--border)] p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            After
          </p>
          <pre className="app-scrollbar max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5">
            {prettyValue(change.after)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function ContractReviewPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [versions, setVersions] = useState<Contract[]>([]);
  const [policies, setPolicies] = useState<GovernancePolicy[]>([]);
  const [reviews, setReviews] = useState<ReleaseReview[]>([]);

  const [contractName, setContractName] = useState("");
  const [fromVersion, setFromVersion] = useState("");
  const [toVersion, setToVersion] = useState("");

  const [initialState, setInitialState] = useState<LoadState>("loading");
  const [versionsState, setVersionsState] = useState<LoadState>("idle");
  const [analysisState, setAnalysisState] = useState<LoadState>("idle");
  const [governanceState, setGovernanceState] = useState<LoadState>("idle");
  const [reviewState, setReviewState] = useState<LoadState>("idle");

  const [diff, setDiff] = useState<ContractDiff | null>(null);
  const [impact, setImpact] = useState<ContractImpact | null>(null);
  const [governance, setGovernance] = useState<GovernanceResult | null>(null);
  const [selectedReview, setSelectedReview] = useState<ReleaseReview | null>(null);

  const [initialError, setInitialError] = useState("");
  const [versionsError, setVersionsError] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [governanceError, setGovernanceError] = useState("");
  const [reviewError, setReviewError] = useState("");

  const [busy, setBusy] = useState(false);

  const loadVersions = useCallback(
    async (name: string, knownContracts: Contract[]) => {
      setVersionsState("loading");
      setVersionsError("");
      setVersions([]);
      setFromVersion("");
      setToVersion("");
      setDiff(null);
      setImpact(null);
      setGovernance(null);
      setSelectedReview(null);
      setAnalysisState("idle");
      setGovernanceState("idle");
      setAnalysisError("");
      setGovernanceError("");

      try {
        const result = await apiRequest<Contract[]>(
          `/api/contracts/${encodeURIComponent(name)}/versions`,
        );

        const sorted = [...result].sort((a, b) =>
          b.version.localeCompare(a.version, undefined, {
            numeric: true,
            sensitivity: "base",
          }),
        );

        setVersions(sorted);

        const fallback = knownContracts.filter((item) => item.name === name);
        const available = sorted.length > 0 ? sorted : fallback;

        if (available.length > 0) {
          setFromVersion(available[1]?.version ?? available[0].version);
          setToVersion(available[0].version);
        }

        setVersionsState("success");
      } catch (error) {
        setVersionsError(errorMessage(error));
        setVersionsState("error");
      }
    },
    [],
  );

  const loadInitialData = useCallback(async () => {
    setInitialState("loading");
    setInitialError("");

    const results = await Promise.allSettled([
      apiRequest<Contract[]>("/api/contracts"),
      apiRequest<GovernancePolicy[]>("/api/governance/policies"),
      apiRequest<ReleaseReview[]>("/api/release-reviews"),
    ]);

    const [contractResult, policyResult, reviewResult] = results;

    if (contractResult.status === "fulfilled") {
      const contractList = contractResult.value;
      setContracts(contractList);

      if (contractList.length > 0) {
        const firstName = contractList[0].name;
        setContractName(firstName);
        void loadVersions(firstName, contractList);
      } else {
        setInitialError("No contracts have been registered yet.");
      }
    } else {
      setInitialError(errorMessage(contractResult.reason));
    }

    if (policyResult.status === "fulfilled") {
      setPolicies(policyResult.value);
    }

    if (reviewResult.status === "fulfilled") {
      setReviews(reviewResult.value);
    }

    setInitialState(
      contractResult.status === "fulfilled" ? "success" : "error",
    );
  }, [loadVersions]);

useEffect(() => {
  void Promise.resolve().then(loadInitialData);
}, [loadInitialData]);

  const selectedContract = useMemo(
    () => contracts.find((item) => item.name === contractName),
    [contracts, contractName],
  );

  const availableVersions = useMemo(() => {
    if (versions.length > 0) return versions;

    return contracts.filter((item) => item.name === contractName);
  }, [contracts, contractName, versions]);

  const versionOptions = useMemo(
    () =>
      Array.from(
        new Set(availableVersions.map((item) => item.version).filter(Boolean)),
      ).sort((a, b) =>
        b.localeCompare(a, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      ),
    [availableVersions],
  );

  const canAnalyze =
    Boolean(contractName) &&
    Boolean(fromVersion) &&
    Boolean(toVersion) &&
    fromVersion !== toVersion &&
    versionsState !== "loading" &&
    !busy;

  async function handleContractChange(name: string) {
    setContractName(name);
    await loadVersions(name, contracts);
  }

  async function analyzeChanges() {
    if (!canAnalyze) return;

    setBusy(true);
    setAnalysisState("loading");
    setAnalysisError("");
    setGovernanceError("");
    setGovernanceState("idle");
    setGovernance(null);
    setDiff(null);
    setImpact(null);
    setSelectedReview(null);
    setReviewError("");

    const encodedName = encodeURIComponent(contractName);
    const query = new URLSearchParams({
      fromVersion,
      toVersion,
    }).toString();

    const [diffResult, impactResult] = await Promise.allSettled([
      apiRequest<ContractDiff>(
        `/api/contracts/${encodedName}/diff?${query}`,
      ),
      apiRequest<ContractImpact>(
        `/api/contracts/${encodedName}/impact?${query}`,
      ),
    ]);

    if (diffResult.status === "fulfilled") {
      setDiff(diffResult.value);
    }

    if (impactResult.status === "fulfilled") {
      setImpact(impactResult.value);
    }

    const errors: string[] = [];

    if (diffResult.status === "rejected") {
      errors.push(`Contract diff: ${errorMessage(diffResult.reason)}`);
    }

    if (impactResult.status === "rejected") {
      errors.push(`Impact analysis: ${errorMessage(impactResult.reason)}`);
    }

    setAnalysisError(errors.join(" "));
    setAnalysisState(errors.length === 0 ? "success" : "error");
    setBusy(false);
  }

  async function evaluateGovernance() {
    if (!impact) return;

    setGovernanceState("loading");
    setGovernanceError("");
    setGovernance(null);

    try {
      const result = await apiRequest<GovernanceResult>(
        "/api/governance/evaluate",
        {
          method: "POST",
          body: JSON.stringify({ impact }),
        },
      );

      setGovernance(result);
      setGovernanceState("success");
    } catch (error) {
      setGovernanceError(errorMessage(error));
      setGovernanceState("error");
    }
  }

  async function createReleaseReview() {
    if (!impact || !governance) return;

    setReviewState("loading");
    setReviewError("");
    setSelectedReview(null);

    try {
      const created = await apiRequest<ReleaseReview>(
        "/api/release-reviews",
        {
          method: "POST",
          body: JSON.stringify({
            contractName,
            fromVersion,
            proposedVersion: toVersion,
          }),
        },
      );

      setSelectedReview(created);
      setReviews((previous) => [
        created,
        ...previous.filter((review) => review.id !== created.id),
      ]);
      setReviewState("success");

      try {
        const latest = await apiRequest<ReleaseReview[]>(
          "/api/release-reviews",
        );
        setReviews(latest);
      } catch {
        // Keep the successfully created review visible if refreshing history fails.
      }
    } catch (error) {
      setReviewError(errorMessage(error));
      setReviewState("error");
    }
  }

  async function openSavedReview(review: ReleaseReview) {
    setReviewError("");
    setSelectedReview(review);

    try {
      const fullReview = await apiRequest<ReleaseReview>(
        `/api/release-reviews/${encodeURIComponent(String(review.id))}`,
      );
      setSelectedReview(fullReview);
    } catch (error) {
      setReviewError(
        `Could not load review details: ${errorMessage(error)}`,
      );
    }
  }

  const affectedAgents = impact?.affectedAgents ?? [];
  const changes = diff?.changes ?? [];
  const findings = governance?.findings ?? [];

  return (
    <div className="mx-auto max-w-[1200px] space-y-7">
      <header className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted-foreground)]">
            <FileSearch className="size-3.5" />
            Release workflow
          </div>

          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Contract review
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
            Compare contract versions, analyze downstream agent impact, and
            evaluate governance before creating a release review.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadInitialData()}
          disabled={initialState === "loading"}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`size-3.5 ${initialState === "loading" ? "animate-spin" : ""}`}
          />
          Refresh data
        </button>
      </header>

      {initialError && <ErrorNotice message={initialError} />}

      <Panel
        title="Select contract versions"
        description="Choose a registered contract and compare a baseline with a proposed version."
        icon={GitBranch}
      >
        {initialState === "loading" ? (
          <div className="flex items-center gap-2 py-6 text-sm text-[var(--muted)]">
            <LoaderCircle className="size-4 animate-spin" />
            Loading contracts, policies and saved reviews…
          </div>
        ) : contracts.length === 0 ? (
          <EmptyState
            title="No contracts available"
            description="Register a contract through the backend before starting a review. Then refresh this page."
          />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-xs font-medium text-[var(--muted-foreground)]">
                  Contract
                </span>
                <select
                  value={contractName}
                  onChange={(event) =>
                    void handleContractChange(event.target.value)
                  }
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--focus-ring)]"
                >
                  {Array.from(
                    new Set(contracts.map((contract) => contract.name)),
                  ).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                {selectedContract?.contractType && (
                  <span className="block text-xs text-[var(--muted)]">
                    Type: {selectedContract.contractType}
                  </span>
                )}
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-medium text-[var(--muted-foreground)]">
                  Baseline version
                </span>
                <select
                  value={fromVersion}
                  onChange={(event) => setFromVersion(event.target.value)}
                  disabled={versionsState === "loading" || versionOptions.length === 0}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--focus-ring)] disabled:opacity-50"
                >
                  <option value="">Select baseline</option>
                  {versionOptions.map((version) => (
                    <option key={version} value={version}>
                      v{version}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-medium text-[var(--muted-foreground)]">
                  Proposed version
                </span>
                <select
                  value={toVersion}
                  onChange={(event) => setToVersion(event.target.value)}
                  disabled={versionsState === "loading" || versionOptions.length === 0}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--focus-ring)] disabled:opacity-50"
                >
                  <option value="">Select proposed version</option>
                  {versionOptions.map((version) => (
                    <option key={version} value={version}>
                      v{version}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {versionsError && <ErrorNotice message={versionsError} />}

            {versionsState === "loading" && (
              <p className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <LoaderCircle className="size-3.5 animate-spin" />
                Loading contract versions…
              </p>
            )}

            {fromVersion && toVersion && fromVersion === toVersion && (
              <p className="text-xs text-amber-600 dark:text-amber-300">
                Select two different versions to compare changes.
              </p>
            )}

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-[var(--muted)]">
                Comparison and impact results come from the backend.
              </p>

              <button
                type="button"
                onClick={() => void analyzeChanges()}
                disabled={!canAnalyze}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {analysisState === "loading" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <FileSearch className="size-4" />
                )}
                Analyze changes
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </Panel>

      {analysisError && <ErrorNotice message={analysisError} />}

      {analysisState === "loading" && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--muted-foreground)]">
          <LoaderCircle className="size-4 animate-spin" />
          Comparing versions and analyzing affected agents…
        </div>
      )}

      {analysisState === "success" && diff && impact && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Changed paths",
                value: impact.changedPathCount,
                description: "Reported by impact analysis",
              },
              {
                label: "Affected agents",
                value: impact.affectedAgentCount,
                description: "Potentially impacted consumers",
              },
              {
                label: "Changes detected",
                value: diff.hasChanges ? "Yes" : "No",
                description: `${diff.changes.length} diff entries`,
              },
              {
                label: "Analysis status",
                value: impact.analysisStatus || "Completed",
                description: "Backend impact result",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <p className="text-xs text-[var(--muted)]">{item.label}</p>
                <p className="mt-2 break-words text-xl font-semibold tracking-tight">
                  {item.value}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  {item.description}
                </p>
              </div>
            ))}
          </section>

          <Panel
            title="Contract diff"
            description={`${diff.contractName}: v${diff.fromVersion} → v${diff.toVersion}`}
            icon={FileSearch}
            action={<StatusPill value={diff.hasChanges ? "CHANGES_DETECTED" : "NO_CHANGES"} />}
          >
            {changes.length === 0 ? (
              <EmptyState
                title="No diff entries returned"
                description="The backend reports the comparison result without individual change entries."
              />
            ) : (
              <div className="space-y-3">
                {changes.map((change, index) => (
                  <ChangeRow
                    key={`${change.path}-${change.type}-${index}`}
                    change={change}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Impact analysis"
            description="Downstream agents reported by the backend dependency analysis."
            icon={GitBranch}
            action={<StatusPill value={impact.analysisStatus} />}
          >
            <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
              <p className="text-xs font-medium text-[var(--muted)]">
                Analysis summary
              </p>
              <p className="mt-2 text-sm leading-6">
                {impact.summary || "No impact summary was returned."}
              </p>
            </div>

            {affectedAgents.length === 0 ? (
              <EmptyState
                title="No affected agents returned"
                description="The backend did not identify any affected agents for this comparison."
              />
            ) : (
              <div className="space-y-2">
                {affectedAgents.map((agent, index) => {
                  const label =
                    agent.agentName ??
                    agent.name ??
                    `Affected agent ${index + 1}`;

                  return (
                    <div
                      key={`${label}-${index}`}
                      className="flex flex-col gap-2 rounded-lg border border-[var(--border)] p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-secondary)]">
                          <GitBranch className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="break-words text-sm font-medium">
                            {label}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            Registered dependency
                          </p>
                        </div>
                      </div>
                      <details className="text-xs text-[var(--muted-foreground)]">
                        <summary className="cursor-pointer">Details</summary>
                        <pre className="app-scrollbar mt-2 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-md bg-[var(--surface-secondary)] p-3">
                          {prettyValue(agent)}
                        </pre>
                      </details>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={() => void evaluateGovernance()}
                disabled={governanceState === "loading"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[var(--border)] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-50 sm:w-auto"
              >
                {governanceState === "loading" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                Evaluate governance policies
                <ArrowDown className="size-4" />
              </button>
            </div>
          </Panel>

          {governanceError && <ErrorNotice message={governanceError} />}

          {governance && (
            <Panel
              title="Governance findings"
              description="Policy decision and findings returned by the governance evaluator."
              icon={ShieldCheck}
              action={<StatusPill value={governance.decision} />}
            >
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Decision",
                    value: governance.decision,
                  },
                  {
                    label: "Policies evaluated",
                    value: governance.evaluatedPolicyCount,
                  },
                  {
                    label: "Policies triggered",
                    value: governance.triggeredPolicyCount,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-[var(--border)] p-3"
                  >
                    <p className="text-xs text-[var(--muted)]">
                      {item.label}
                    </p>
                    <p className="mt-2 break-words text-lg font-semibold">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
                <p className="text-xs font-medium text-[var(--muted)]">
                  Evaluation summary
                </p>
                <p className="mt-2 text-sm leading-6">
                  {governance.summary || "No summary was returned."}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <h3 className="text-sm font-semibold">
                  Findings ({findings.length})
                </h3>

                {findings.length === 0 ? (
                  <EmptyState
                    title="No findings returned"
                    description="The evaluator returned no individual findings. Use the decision and summary above as the authoritative result."
                  />
                ) : (
                  findings.map((finding, index) => (
                    <div
                      key={`${finding.policyName ?? finding.name ?? "finding"}-${index}`}
                      className="rounded-lg border border-[var(--border)] p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {finding.policyName ??
                              finding.name ??
                              `Finding ${index + 1}`}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {finding.ruleType ?? "Governance policy"}
                          </p>
                        </div>
                        {finding.severity && (
                          <StatusPill value={finding.severity} />
                        )}
                      </div>

                      {(finding.message || finding.description) && (
                        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                          {finding.message ?? finding.description}
                        </p>
                      )}

                      <details className="mt-3 text-xs text-[var(--muted)]">
                        <summary className="cursor-pointer">
                          Raw finding details
                        </summary>
                        <pre className="app-scrollbar mt-2 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-md bg-[var(--surface-secondary)] p-3">
                          {prettyValue(finding)}
                        </pre>
                      </details>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => void createReleaseReview()}
                  disabled={reviewState === "loading"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
                >
                  {reviewState === "loading" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <FileCheck2 className="size-4" />
                  )}
                  Create saved release review
                </button>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-[var(--muted)]">
                  This submits the contract name, baseline version and proposed
                  version to the existing release-review API. The backend
                  creates the saved review and computes its own findings.
                </p>
              </div>
            </Panel>
          )}

          {reviewError && <ErrorNotice message={reviewError} />}

          {selectedReview && (
            <section
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    Release review {reviewState === "success" ? "saved" : "details"}
                  </p>
                  <p className="mt-1 break-words text-xs text-[var(--muted)]">
                    Review ID: {selectedReview.id}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusPill value={selectedReview.status} />
                    <span className="text-xs text-[var(--muted)]">
                      Proposed version: {selectedReview.proposedVersion}
                    </span>
                  </div>
                </div>
              </div>
              {selectedReview.findings !== undefined && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-medium">
                    View saved review findings
                  </summary>
                  <pre className="app-scrollbar mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-4 font-mono text-xs leading-5">
                    {prettyValue(selectedReview.findings)}
                  </pre>
                </details>
              )}
            </section>
          )}
        </>
      )}

      <Panel
        title="Saved release reviews"
        description="Review records retrieved from the backend."
        icon={FileCheck2}
        action={
          <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)]">
            {reviews.length} records
          </span>
        }
      >
        {reviews.length === 0 ? (
          <EmptyState
            title="No saved reviews"
            description="Once you create a release review, its saved record will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--muted)]">
                  <th className="px-3 py-3 font-medium">Review</th>
                  <th className="px-3 py-3 font-medium">Proposed version</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Created</th>
                  <th className="px-3 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="border-b border-[var(--border)] last:border-0"
                  >
                    <td className="px-3 py-3">
                      <span className="font-medium">
                        {review.contractName ?? review.contractId ?? "Contract"}
                      </span>
                      <span className="mt-1 block text-xs text-[var(--muted)]">
                        ID: {review.id}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {review.proposedVersion}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill value={review.status} />
                    </td>
                    <td className="px-3 py-3 text-xs text-[var(--muted-foreground)]">
                      {displayDate(review.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => void openSavedReview(review)}
                        className="rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium hover:bg-[var(--surface-hover)]"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reviewError && <div className="mt-4"><ErrorNotice message={reviewError} /></div>}
      </Panel>

      {policies.length > 0 && (
        <p className="text-xs text-[var(--muted)]">
          {policies.filter((policy) => policy.enabled !== false).length} enabled
          policies found in the registry. The governance decision shown above
          comes from the backend evaluator.
        </p>
      )}
    </div>
  );
}
