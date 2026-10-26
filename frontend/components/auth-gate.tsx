"use client";

import { ClerkProvider, SignIn, useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { setAuthTokenProvider, setWorkspace } from "@/lib/api";

type Workspace = "demo" | "personal";
const WORKSPACE_STORAGE_PREFIX = "reach.workspace:";

function workspaceStorageKey(userId: string) {
  return `${WORKSPACE_STORAGE_PREFIX}${userId}`;
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
      <div className="text-center">
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--foreground)]" />
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">
          Loading Reach.Online…
        </p>
      </div>
    </main>
  );
}

function ConfigurationError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 text-[var(--foreground)]">
      <div className="max-w-md rounded-sm border border-red-500/30 bg-red-500/5 p-5 text-center">
        <h1 className="text-sm font-semibold">Authentication is not configured</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in frontend/.env.local and
          restart the Next.js development server.
        </p>
      </div>
    </main>
  );
}

function WorkspaceSelection({
  onSelect,
  isAdmin,
}: {
  onSelect: (workspace: Workspace) => void;
  isAdmin: boolean;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 text-[var(--foreground)]">
      <section className="w-full max-w-2xl space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
            Reach.Online
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            Choose a workspace
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            Select where you want to review contracts and manage governance.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelect("personal")}
            className="rounded-sm border border-[var(--border)] bg-[var(--surface)] p-5 text-left transition-colors hover:bg-[var(--surface-hover)]"
          >
            <p className="text-sm font-semibold">Use Your Personal Workspace</p>
            <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
              Keep your private agents, tools, contracts, policies, and release reviews separate from the demo.
            </p>
          </button>
          <button
            type="button"
            onClick={() => onSelect("demo")}
            className="rounded-sm border border-[var(--border)] bg-[var(--surface)] p-5 text-left transition-colors hover:bg-[var(--surface-hover)]"
          >
            <p className="text-sm font-semibold">See Demo Page</p>
            <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
              Explore the shared demo workspace{isAdmin ? " with management permissions" : " in read-only mode"}.
            </p>
          </button>
        </div>
      </section>
    </main>
  );
}

function AuthenticatedContent({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();
  const router = useRouter();
  const [workspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    if (!isLoaded || !isUserLoaded) return;
    if (!isSignedIn || !user) {
      setAuthTokenProvider(null);
      // The selected workspace must be cleared when the Clerk identity changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedWorkspace(null);
      setWorkspace("demo");
      return;
    }

    setAuthTokenProvider(getToken);
    const stored = window.localStorage.getItem(workspaceStorageKey(user.id));
    const isAdmin = user.publicMetadata?.role === "admin";
    const nextWorkspace =
      isAdmin && stored === "personal"
        ? "demo"
        : stored === "demo" || stored === "personal"
          ? stored
          : null;

    // The workspace is derived from the newly loaded Clerk identity and its storage key.
    setSelectedWorkspace(nextWorkspace);
    setWorkspace(nextWorkspace ?? "demo");
    if (nextWorkspace) {
      window.localStorage.setItem(workspaceStorageKey(user.id), nextWorkspace);
    }
  }, [getToken, isLoaded, isSignedIn, isUserLoaded, user]);

  if (!isLoaded || !isUserLoaded) return <LoadingScreen />;

  if (!isSignedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
        <SignIn routing="hash" fallbackRedirectUrl="/" />
      </main>
    );
  }

  if (!workspace) {
    const role = user?.publicMetadata?.role;
    return (
      <WorkspaceSelection
        isAdmin={role === "admin"}
        onSelect={(nextWorkspace) => {
          if (nextWorkspace === "personal" && role === "admin") return;
          if (!user) return;
          window.localStorage.setItem(
            workspaceStorageKey(user.id),
            nextWorkspace,
          );
          setWorkspace(nextWorkspace);
          setSelectedWorkspace(nextWorkspace);
          router.push("/");
        }}
      />
    );
  }

  return <>{children}</>;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return <ConfigurationError />;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <AuthenticatedContent>{children}</AuthenticatedContent>
    </ClerkProvider>
  );
}
