
"use client";

import Image from "next/image";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Workflow,
} from "lucide-react";

type OverviewHeroProps = {
  connection:
    | { status: "checking" }
    | { status: "connected"; application: string }
    | { status: "disconnected"; message: string };
  loading: boolean;
  onRefresh: () => void;
};

export default function OverviewHero({
  connection,
  loading,
  onRefresh,
}: OverviewHeroProps) {
  return (
    <div className="space-y-5">
      <section className="relative isolate overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr]">
          {/* Robot artwork: top on mobile, left on desktop */}
          <div className="relative order-1 min-h-[300px] overflow-hidden bg-[#111416] sm:min-h-[400px] lg:order-1 lg:min-h-[470px]">
            <Image
              src="/robot.png"
              alt="Chrome humanoid robot representing AI agent systems"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 52vw"
              className="object-cover object-[58%_center] transition-transform duration-700 hover:scale-[1.025]"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/15"
            />

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-white/70">
                <Workflow className="size-4 text-[#F07870]" />
                Intelligent agent ecosystem
              </div>

              <h2 className="max-w-lg text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
                Govern every agent.
                <br />
                Trust every interaction.
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
                Visibility, dependencies, and policy-driven release governance
                for AI-powered systems.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {["Agents", "Tools", "Dependencies", "Governance"].map(
                  (item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-xs text-white/85 backdrop-blur-sm"
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div
              aria-hidden="true"
              className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-[#F07870] via-white/20 to-transparent"
            />
          </div>

          {/* Overview controls */}
          <div className="relative z-10 order-2 flex flex-col justify-center gap-6 border-t border-[var(--border)] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted-foreground)]">
              <span className="size-1.5 rounded-full bg-[var(--foreground)]" />
              AI agent governance
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl xl:text-5xl">
                Overview
              </h1>

              <p className="max-w-xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
                Monitor registered agents and tools, inspect dependencies and
                track contract release governance.
              </p>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh data
            </button>

            <div className="flex items-start gap-3 border-t border-[var(--border)] pt-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]">
                <ShieldCheck className="size-5" />
              </div>

              <div className="min-w-0 space-y-1.5">
                <h3 className="text-sm font-semibold">
                  Release governance
                </h3>
                <p className="text-sm leading-5 text-[var(--muted-foreground)]">
                  Understand contract changes, trace affected dependencies, and
                  evaluate policy compliance before release.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
