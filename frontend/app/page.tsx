
"use client";

import {
  Activity,
  AlertCircle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  FileCheck2,
  FileSearch,
  GitBranch,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  apiRequest,
  ApiError,
  checkBackendHealth,
  type ApiResponse,
  type BackendHealth,
} from "@/lib/api";

type ConnectionState =
  | { status: "checking" }
  | { status: "connected"; health: BackendHealth }
  | { status: "disconnected"; message: string };

type Agent = { name: string };
type Tool = { name: string };
type Dependency = { agentName: string; toolName: string };
type Contract = { name: string; version: string };
type Policy = { id?: string | number; name: string; enabled: boolean };
type Review = {
  id: string | number;
  contractName?: string;
  proposedVersion: string;
  status: string;
  createdAt?: string;
};

type DashboardData = {
  agents: Agent[];
  tools: Tool[];
  dependencies: Dependency[];
  contracts: Contract[];
  policies: Policy[];
  reviews: Review[];
  available: {
    agents: boolean;
    tools: boolean;
    dependencies: boolean;
    contracts: boolean;
    policies: boolean;
    reviews: boolean;
  };
};

function displayDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function StatCard({
  label,
  value,
  icon: Icon,
  detail,
}: {
  label: string;
  value: number | string;
  icon: typeof Boxes;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[var(--muted)]">{label}</p>
        <Icon className="size-4 text-[var(--muted)]" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>
    </div>
  );
}

export default function Home() {
  const [connection, setConnection] = useState<ConnectionState>({
    status: "checking",
  });
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      checkBackendHealth(),
      apiRequest<ApiResponse<Agent[]>>("/api/registry/agents"),
      apiRequest<ApiResponse<Tool[]>>("/api/registry/tools"),
      apiRequest<ApiResponse<Dependency[]>>("/api/registry/dependencies"),
      apiRequest<Contract[]>("/api/contracts"),
      apiRequest<Policy[]>("/api/governance/policies"),
      apiRequest<Review[]>("/api/release-reviews"),
    ]);

    const [
      healthResult,
      agentsResult,
      toolsResult,
      dependenciesResult,
      contractsResult,
      policiesResult,
      reviewsResult,
    ] = results;

    if (healthResult.status === "fulfilled") {
      setConnection({ status: "connected", health: healthResult.value });
    } else {
      setConnection({
        status: "disconnected",
        message:
          healthResult.reason instanceof ApiError
            ? healthResult.reason.message
            : "Could not reach the backend health endpoint.",
      });
    }

    const failed = results
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.status === "rejected");

    if (failed.length > 0) {
      setError(
        `${failed.length} dashboard request(s) failed. Some totals may be unavailable; use Refresh to retry.`,
      );
    }

    if (
      agentsResult.status === "fulfilled" &&
      toolsResult.status === "fulfilled" &&
      dependenciesResult.status === "fulfilled" &&
      contractsResult.status === "fulfilled" &&
      policiesResult.status === "fulfilled" &&
      reviewsResult.status === "fulfilled"
    ) {
      setData({
        agents: agentsResult.value.data,
        tools: toolsResult.value.data,
        dependencies: dependenciesResult.value.data,
        contracts: contractsResult.value,
        policies: policiesResult.value,
        reviews: reviewsResult.value,
        available: {
          agents: true,
          tools: true,
          dependencies: true,
          contracts: true,
          policies: true,
          reviews: true,
        },
      });
    } else {
      setData((previous) => ({
        agents:
          agentsResult.status === "fulfilled"
            ? agentsResult.value.data
            : previous?.agents ?? [],
        tools:
          toolsResult.status === "fulfilled"
            ? toolsResult.value.data
            : previous?.tools ?? [],
        dependencies:
          dependenciesResult.status === "fulfilled"
            ? dependenciesResult.value.data
            : previous?.dependencies ?? [],
        contracts:
          contractsResult.status === "fulfilled"
            ? contractsResult.value
            : previous?.contracts ?? [],
        policies:
          policiesResult.status === "fulfilled"
            ? policiesResult.value
            : previous?.policies ?? [],
        reviews:
          reviewsResult.status === "fulfilled"
            ? reviewsResult.value
            : previous?.reviews ?? [],
        available: {
          agents: agentsResult.status === "fulfilled" || previous?.available.agents === true,
          tools: toolsResult.status === "fulfilled" || previous?.available.tools === true,
          dependencies:
            dependenciesResult.status === "fulfilled" ||
            previous?.available.dependencies === true,
          contracts:
            contractsResult.status === "fulfilled" ||
            previous?.available.contracts === true,
          policies:
            policiesResult.status === "fulfilled" ||
            previous?.available.policies === true,
          reviews:
            reviewsResult.status === "fulfilled" ||
            previous?.available.reviews === true,
        },
      }));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadDashboard);
  }, [loadDashboard]);

  const cards = [
    {
      label: "Registered agents",
      value: data?.available.agents ? data.agents.length : "—",
      icon: Boxes,
      detail: "Agents in registry",
    },
    {
      label: "Registered tools",
      value: data?.available.tools ? data.tools.length : "—",
      icon: Wrench,
      detail: "Tools in registry",
    },
    {
      label: "Dependencies",
      value: data?.available.dependencies ? data.dependencies.length : "—",
      icon: GitBranch,
      detail: "Agent-tool relationships",
    },
    {
      label: "Contracts",
      value: data?.available.contracts ? data.contracts.length : "—",
      icon: FileSearch,
      detail: "Contract records returned",
    },
    {
      label: "Governance policies",
      value: data?.available.policies ? data.policies.length : "—",
      icon: ShieldCheck,
      detail: data?.available.policies
        ? `${data.policies.filter((policy) => policy.enabled).length} enabled`
        : "Unavailable",
    },
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-8">
      <header className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted-foreground)]">
            <span className="size-1.5 rounded-full bg-[var(--foreground)]" />
            AI agent governance
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Overview
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
            Monitor registered agents and tools, inspect dependencies and track
            contract release governance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface-hover)] disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh data
        </button>
      </header>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)]">
              <Activity className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Backend connection</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Live status from Spring Boot.
              </p>
            </div>
          </div>

          {connection.status === "checking" ? (
            <span className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <LoaderCircle className="size-4 animate-spin" />
              Checking…
            </span>
          ) : connection.status === "connected" ? (
            <span className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              Backend connected · {connection.health.application}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="size-4" />
              {connection.message}
            </span>
          )}
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-300">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
            Live data
          </p>
          <h2 className="mt-1 text-base font-semibold">Platform overview</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Counts are based on the records returned by your backend APIs.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => (
            <StatCard key={card.label} {...card} value={loading && !data ? "—" : card.value} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
            <div>
              <h2 className="text-sm font-semibold">Recent release reviews</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Latest records returned by the backend.
              </p>
            </div>
            <FileCheck2 className="size-4 text-[var(--muted)]" />
          </div>

          {!data || !data.available.reviews ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium">
                {loading
                  ? "Loading reviews…"
                  : "Reviews are currently unavailable"}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {data?.available.reviews
                  ? "Create a review to see it listed here."
                  : "Refresh the dashboard to retry this request."}
              </p>
            </div>
          ) : data.reviews.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium">No saved reviews yet</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Create a review to see it listed here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {[...data.reviews]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt ?? 0).getTime() -
                    new Date(a.createdAt ?? 0).getTime(),
                )
                .slice(0, 5)
                .map((review) => (
                  <div
                    key={review.id}
                    className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium">
                        {review.contractName ?? "Contract review"}{" "}
                        <span className="text-[var(--muted)]">
                          · v{review.proposedVersion}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {displayDate(review.createdAt)} · ID {review.id}
                      </p>
                    </div>
                    <span className="w-fit rounded-full border border-[var(--border)] px-2.5 py-1 text-xs">
                      {review.status}
                    </span>
                  </div>
                ))}
            </div>
          )}

          <div className="border-t border-[var(--border)] p-4">
            <Link
              href="/contract-review"
              className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
            >
              Open contract review
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] p-4">
            <h2 className="text-sm font-semibold">Quick actions</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Go directly to a workspace.
            </p>
          </div>
          <div className="space-y-2 p-3">
            {[
              {
                title: "Review a contract",
                description: "Compare versions and evaluate governance",
                href: "/contract-review",
                icon: FileSearch,
              },
              {
                title: "Manage registry",
                description: "Register agents, tools and dependencies",
                href: "/registry",
                icon: Boxes,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-[var(--border)] hover:bg-[var(--surface-secondary)]"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-[var(--border)]">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {item.description}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-[var(--muted)]" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
