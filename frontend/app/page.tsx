"use client";

import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileSearch,
  GitBranch,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  ApiError,
  checkBackendHealth,
  type BackendHealth,
} from "@/lib/api";

type ConnectionState =
  | { status: "checking" }
  | { status: "connected"; health: BackendHealth }
  | { status: "disconnected"; message: string };

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
        {eyebrow}
      </p>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <p className="text-sm leading-6 text-[var(--muted-foreground)]">
        {description}
      </p>
    </div>
  );
}

function ConnectionStatus({
  connection,
  onRetry,
}: {
  connection: ConnectionState;
  onRetry: () => void;
}) {
  if (connection.status === "checking") {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <LoaderCircle className="size-4 animate-spin" />
        Checking backend connection…
      </div>
    );
  }

  if (connection.status === "connected") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-1.5 text-xs font-medium">
          <CheckCircle2 className="size-3.5 text-[var(--success)]" />
          Backend connected
        </span>
        <span className="text-xs text-[var(--muted)]">
          {connection.health.application}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 text-sm">
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-[var(--danger)]" />
        <div>
          <p className="font-medium">Backend unavailable</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            {connection.message}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-hover)]"
      >
        <RefreshCw className="size-3.5" />
        Try again
      </button>
    </div>
  );
}

const plannedAreas = [
  {
    number: "01",
    title: "Contract release review",
    description:
      "Compare contract versions, inspect changed paths, identify potentially affected agents and evaluate governance policies.",
    icon: FileSearch,
    step: "Step 2",
  },
  {
    number: "02",
    title: "Agent and tool registry",
    description:
      "Manage registered agents, tools, their dependencies, contract versions and governance policies.",
    icon: GitBranch,
    step: "Step 3",
  },
  {
    number: "03",
    title: "Release governance",
    description:
      "Present explainable policy findings and release decisions using the existing backend review workflow.",
    icon: ShieldCheck,
    step: "Step 2",
  },
];

export default function Home() {
  const [connection, setConnection] = useState<ConnectionState>({
    status: "checking",
  });

  const refreshConnection = useCallback(async () => {
    setConnection({ status: "checking" });

    try {
      const health = await checkBackendHealth();

      setConnection({
        status: "connected",
        health,
      });
    } catch (error) {
      setConnection({
        status: "disconnected",
        message:
          error instanceof ApiError
            ? error.message
            : "An unexpected error occurred while checking the backend.",
      });
    }
  }, []);

  useEffect(() => {
    void refreshConnection();
  }, [refreshConnection]);

  return (
    <div className="mx-auto max-w-[1200px] space-y-8">
      <section className="flex flex-col justify-between gap-5 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted-foreground)]">
            <span className="size-1.5 rounded-full bg-[var(--foreground)]" />
            AI agent governance
          </div>

          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Overview
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
            Review API contract changes, understand agent dependencies and
            establish explainable release governance in one workspace.
          </p>
        </div>

        <div className="text-xs text-[var(--muted)]">
          Reach.Online workspace
        </div>
      </section>

      <section
        aria-labelledby="connection-heading"
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)]">
              <Activity className="size-5" />
            </div>

            <div className="space-y-1">
              <h2
                id="connection-heading"
                className="text-sm font-semibold"
              >
                Backend connection
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Live status from the Spring Boot health endpoint.
              </p>
            </div>
          </div>

          <ConnectionStatus
            connection={connection}
            onRetry={() => void refreshConnection()}
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow="Platform"
          title="Governance workflow"
          description="The core areas of Reach.Online, introduced in the planned implementation sequence."
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {plannedAreas.map((area) => {
            const Icon = area.icon;

            return (
              <article
                key={area.number}
                className="group flex min-h-[220px] flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:bg-[var(--surface-secondary)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)]">
                    <Icon className="size-5" />
                  </div>

                  <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-medium text-[var(--muted)]">
                    {area.step}
                  </span>
                </div>

                <div className="mt-5 flex-1 space-y-2">
                  <h3 className="text-sm font-semibold">{area.title}</h3>
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                    {area.description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
                  <span>Planned</span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-[var(--border-strong)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)]">
            <ShieldCheck className="size-5" />
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">
              Built around explainable governance
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
              Reach.Online is designed to connect proposed API and MCP tool
              contract changes with registered dependencies, policy findings
              and saved release reviews. The following implementation steps
              will connect those workflows to your existing backend.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}