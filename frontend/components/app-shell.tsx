"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  Blocks,
  ChevronDown,
  Command,
  FileSearch,
  GitBranch,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useTheme } from "next-themes";

import { ThemeToggle } from "@/components/theme-toggle";

type AppShellProps = {
  children: ReactNode;
};

const primaryNavigation = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
    status: "available",
  },
  {
    label: "Contract review",
    href: "/contract-review",
    icon: FileSearch,
    status: "upcoming",
    step: "Step 2",
  },
  {
    label: "Agent & tool registry",
    href: "/registry",
    icon: Blocks,
    status: "upcoming",
    step: "Step 3",
  },
] as const;

function BrandLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && resolvedTheme === "light"
      ? "/brand/reach-light.png"
      : "/brand/reach-dark.png";

  return (
    <Link
      href="/"
      aria-label="Reach.Online home"
      className="flex min-w-0 items-center gap-3 rounded-md"
    >
      <Image
        src={logoSrc}
        alt="Reach.Online"
        width={168}
        height={42}
        priority
        className="h-auto max-h-9 w-auto max-w-[168px] object-contain"
      />
    </Link>
  );
}

function Sidebar({
  pathname,
  mobile = false,
  onNavigate,
}: {
  pathname: string;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[65px] items-center justify-between border-b border-[var(--border)] px-5">
        <BrandLogo />

        {mobile && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onNavigate}
            className="inline-flex size-8 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="px-3 pt-5">
        <div className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          Workspace
        </div>

        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-hover)]"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-secondary)]">
            <Command className="size-3.5" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              Reach Workspace
            </span>
            <span className="block truncate text-xs text-[var(--muted)]">
              Governance platform
            </span>
          </span>

          <ChevronDown className="size-4 shrink-0 text-[var(--muted)]" />
        </button>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-6"
      >
        <div className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          Platform
        </div>

        {primaryNavigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.status === "available" && pathname === item.href;

          if (item.status === "upcoming") {
            return (
              <div
                key={item.href}
                title={`${item.label} — planned for ${item.step}`}
                className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[var(--muted)] opacity-75"
                aria-disabled="true"
              >
                <Icon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <span className="shrink-0 text-[10px]">{item.step}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-[var(--surface-hover)] font-medium text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {isActive && (
                <span className="size-1.5 rounded-full bg-[var(--foreground)]" />
              )}
            </Link>
          );
        })}

        <div className="mb-2 mt-8 px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          Governance
        </div>

        <div
          className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[var(--muted)] opacity-75"
          aria-disabled="true"
          title="Dependency visualization is planned for Step 3"
        >
          <GitBranch className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">Dependencies</span>
          <span className="text-[10px]">Step 3</span>
        </div>

        <div
          className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[var(--muted)] opacity-75"
          aria-disabled="true"
          title="Governance policy management is planned for Step 3"
        >
          <ShieldCheck className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">Policies</span>
          <span className="text-[10px]">Step 3</span>
        </div>
      </nav>

      <div className="border-t border-[var(--border)] p-4">
        <div className="flex items-center gap-2 rounded-md px-2 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-secondary)]">
            <Activity className="size-4 text-[var(--muted-foreground)]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium">Developer workspace</span>
            <span className="block text-xs text-[var(--muted)]">
              Local environment
            </span>
          </span>
          <ArrowUpRight className="size-3.5 text-[var(--muted)]" />
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-[var(--border)] bg-[var(--background)] lg:block">
        <Sidebar pathname={pathname} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="absolute inset-y-0 left-0 w-[min(300px,85vw)] border-r border-[var(--border)] bg-[var(--background)] shadow-2xl">
            <Sidebar
              pathname={pathname}
              mobile
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[65px] items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--background)]/95 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-hover)] lg:hidden"
            >
              <Menu className="size-4" />
            </button>

            <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
              <span className="text-[var(--muted)]">Reach.Online</span>
              <span className="text-[var(--border-strong)]">/</span>
              <span className="truncate font-medium text-[var(--foreground)]">
                {pathname === "/" ? "Overview" : "Workspace"}
              </span>
            </div>

            <div className="min-w-0 sm:hidden">
              <BrandLogo />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 text-xs text-[var(--muted)] md:flex">
              <span className="size-1.5 rounded-full bg-[var(--muted)]" />
              Development
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}

          <footer className="mt-12 flex flex-col gap-2 border-t border-[var(--border)] py-5 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
            <span>Reach.Online · AI Agent API Governance</span>
            <span>Development workspace</span>
          </footer>
        </main>
      </div>
    </div>
  );
}