
"use client";

import {
  AlertCircle,
  ArrowRight,
  Boxes,
  FileCheck2,
  FileSearch,
  GitBranch,
  ShieldCheck,
  LoaderCircle,
  CheckCircle2,
  // RefreshCw,
  Activity,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import OverviewHero from "@/components/overview-hero";
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
  iconColor,
  iconBackground,
}: {
  label: string;
  value: number | string;
  icon: typeof Boxes;
  detail: string;
  iconColor: string;
  iconBackground: string;
}) {
  return (
    <div className="rounded-sm border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-secondary)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[var(--muted)]">{label}</p>

        <div
          className={`flex size-9 items-center justify-center rounded-lg ${iconBackground}`}
        >
          <Icon className={`size-[21px] ${iconColor}`} />
        </div>
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
      setConnection({
        status: "connected",
        health: healthResult.value,
      });
    } else {
      setConnection({
        status: "disconnected",
        message:
          healthResult.reason instanceof ApiError
            ? healthResult.reason.message
            : "Could not reach the backend health endpoint.",
      });
    }

    const failed = results.filter(
      (result) => result.status === "rejected",
    );

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
          agents:
            agentsResult.status === "fulfilled" ||
            previous?.available.agents === true,
          tools:
            toolsResult.status === "fulfilled" ||
            previous?.available.tools === true,
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
    iconColor: "text-violet-500",
    iconBackground: "#09090b",
  },
  {
    label: "Registered tools",
    value: data?.available.tools ? data.tools.length : "—",
    icon: Wrench,
    detail: "Tools in registry",
    iconColor: "text-sky-500",
    iconBackground: "#09090b",
  },
  {
    label: "Dependencies",
    value: data?.available.dependencies ? data.dependencies.length : "—",
    icon: GitBranch,
    detail: "Agent-tool relationships",
    iconColor: "text-amber-500",
    iconBackground: "#09090b",
  },
  {
    label: "Contracts",
    value: data?.available.contracts ? data.contracts.length : "—",
    icon: FileSearch,
    detail: "Contract records returned",
    iconColor: "text-rose-500",
    iconBackground: "#09090b",
  },
  {
    label: "Governance policies",
    value: data?.available.policies ? data.policies.length : "—",
    icon: ShieldCheck,
    detail: data?.available.policies
      ? `${data.policies.filter((policy) => policy.enabled).length} enabled`
      : "Unavailable",
    iconColor: "text-emerald-500",
    iconBackground: "#09090b",
  },
];


  const heroConnection =
    connection.status === "connected"
      ? {
          status: "connected" as const,
          application: connection.health.application,
        }
      : connection;

  return (
    <div className="mx-auto max-w-[1200px] space-y-8">
      {/* Overview hero: heading, refresh and backend status appear once */}
<OverviewHero
  connection={heroConnection}
  loading={loading}
  onRefresh={() => void loadDashboard()}
/>

      {error && (
        <div
          role="alert"
          className="rounded-sm border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-300"
        >
          {error}
        </div>
      )}

      {/* Platform statistics */}
      <section className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
            Live data
          </p>
          <h2 className="mt-1 text-base font-semibold">
            Platform overview
          </h2>
          {/* <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Counts are based on the records returned by your backend APIs.
          </p> */}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => (
            <StatCard
              key={card.label}
              {...card}
              value={loading && !data ? "—" : card.value}
            />
          ))}
        </div>
      </section>

      {/* Recent reviews and quick actions */}
      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-sm border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-4">
            <div>
              <h2 className="text-md font-semibold">
                Recent release reviews
              </h2>
              {/* <p className="mt-1 text-xs text-[var(--muted)]">
                Latest records returned.
              </p> */}
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
                Refresh the dashboard to retry this request.
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

        <div className="rounded-sm border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] p-4">
            <h2 className="text-md font-semibold">Quick actions</h2>
            {/* <p className="mt-1 text-xs text-[var(--muted)]">
              Go directly to a workspace.
            </p> */}
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
                  className="flex items-center gap-3 rounded-sm border border-transparent p-3 transition-colors hover:border-[var(--border)] hover:bg-[var(--surface-secondary)]"
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

      {/* Backend connection — bottom of the dashboard */}
<section className="flex flex-col gap-4 border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
  <div className="flex items-start gap-3">
    <div className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-[var(--border)] bg-[var(--surface-secondary)]">
      <Activity className="size-5" />
    </div>

    <div>
      <h2 className="text-sm font-semibold">Backend connection</h2>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Live status from Spring Boot.
      </p>
    </div>
  </div>

  <div className="min-w-0 sm:max-w-[55%]">
    {connection.status === "checking" && (
      <span className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <LoaderCircle className="size-4 shrink-0 animate-spin" />
        Checking backend connection…
      </span>
    )}

    {connection.status === "connected" && (
      <span className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
        <span className="break-words">
          Backend connected · {connection.health.application}
        </span>
      </span>
    )}

    {connection.status === "disconnected" && (
      <span className="flex items-start gap-2 text-sm text-red-500">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <span className="break-words">{connection.message}</span>
      </span>
    )}
  </div>
</section>
    </div>
  );
}
