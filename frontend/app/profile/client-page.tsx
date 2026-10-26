"use client";

import { useCallback, useEffect, useState } from "react";

import { apiRequest, ApiError } from "@/lib/api";

type Profile = {
  userId: string;
  displayName: string;
  bio?: string;
  website?: string;
  publicProfile: boolean;
  updatedAt?: string;
};

function messageFrom(error: unknown) {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [publicProfile, setPublicProfile] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const current = await apiRequest<Profile>("/api/profiles/me");
      setProfile(current);
      setDisplayName(current.displayName);
      setBio(current.bio ?? "");
      setWebsite(current.website ?? "");
      setPublicProfile(current.publicProfile);
    } catch (loadError) {
      setError(messageFrom(loadError));
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadProfile);
  }, [loadProfile]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    setError("");

    try {
      const updated = await apiRequest<Profile>("/api/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ displayName, bio, website, publicProfile }),
      });
      setProfile(updated);
      setStatus("Profile saved.");
    } catch (saveError) {
      setError(messageFrom(saveError));
    } finally {
      setBusy(false);
    }
  }

  async function deleteProfile() {
    if (!window.confirm("Delete your profile information?")) return;
    setBusy(true);
    setStatus("");
    setError("");

    try {
      await apiRequest<void>("/api/profiles/me", { method: "DELETE" });
      setProfile(null);
      setDisplayName("");
      setBio("");
      setWebsite("");
      setPublicProfile(false);
      setStatus("Profile information deleted.");
    } catch (deleteError) {
      setError(messageFrom(deleteError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          Your profile
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Manage your public profile
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          Your profile is separate from both your personal workspace and the shared demo workspace.
        </p>
      </header>

      <form
        onSubmit={saveProfile}
        className="space-y-5 rounded-sm border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium">Display name</span>
          <input
            required
            maxLength={160}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded-sm border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--focus-ring)]"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Bio</span>
          <textarea
            maxLength={2000}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={5}
            className="w-full rounded-sm border border-[var(--border)] bg-[var(--background)] p-3 text-sm outline-none focus:border-[var(--focus-ring)]"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Website</span>
          <input
            maxLength={500}
            type="url"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-sm border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--focus-ring)]"
          />
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={publicProfile}
            onChange={(event) => setPublicProfile(event.target.checked)}
            className="mt-0.5 size-4 accent-[var(--accent)]"
          />
          <span>
            <span className="block font-medium">Publish profile</span>
            <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
              Other authenticated users can view this information, but only you can edit it.
            </span>
          </span>
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {status && <p className="text-sm text-emerald-600">{status}</p>}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy || !profile}
            className="rounded-sm bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save profile"}
          </button>
          <button
            type="button"
            disabled={busy || !profile}
            onClick={() => void deleteProfile()}
            className="rounded-sm border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-600 disabled:opacity-50 dark:text-red-400"
          >
            Delete profile information
          </button>
        </div>
      </form>
    </section>
  );
}
