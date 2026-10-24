"use client";


import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme();

  const mounted = useSyncExternalStore(
  () => () => {},
  () => true,
  () => false,
);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Change appearance"
        className="inline-flex size-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)]"
      >
        <Monitor className="size-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1">
      <button
        type="button"
        aria-label="Use light theme"
        title="Light theme"
        aria-pressed={theme === "light"}
        onClick={() => setTheme("light")}
        className={`inline-flex size-8 items-center justify-center rounded-md transition-colors ${
          theme === "light"
            ? "bg-[var(--surface-hover)] text-[var(--foreground)]"
            : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
        }`}
      >
        <Sun className="size-4" />
      </button>

      <button
        type="button"
        aria-label="Use dark theme"
        title="Dark theme"
        aria-pressed={theme === "dark"}
        onClick={() => setTheme("dark")}
        className={`inline-flex size-8 items-center justify-center rounded-md transition-colors ${
          isDark
            ? "bg-[var(--surface-hover)] text-[var(--foreground)]"
            : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
        }`}
      >
        <Moon className="size-4" />
      </button>

      <button
        type="button"
        aria-label="Use system theme"
        title="System theme"
        aria-pressed={theme === "system"}
        onClick={() => setTheme("system")}
        className={`inline-flex size-8 items-center justify-center rounded-md transition-colors ${
          theme === "system"
            ? "bg-[var(--surface-hover)] text-[var(--foreground)]"
            : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
        }`}
      >
        <Monitor className="size-4" />
      </button>
    </div>
  );
}