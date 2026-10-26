"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest, ApiError } from "@/lib/api";

type PublicProfile = {
  userId: string;
  displayName: string;
  bio?: string;
  website?: string;
  updatedAt?: string;
};

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void apiRequest<PublicProfile[]>("/api/profiles/public")
      .then(setProfiles)
      .catch((loadError: unknown) => {
        setError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : "Could not load public profiles.",
        );
      });
  }, []);

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          Community
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          Public profiles
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          Published profiles are read-only to everyone except their owner.
        </p>
      </header>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!error && profiles.length === 0 && (
        <div className="rounded-sm border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--muted-foreground)]">
          No profiles have been published yet.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {profiles.map((profile) => (
          <Link
            key={profile.userId}
            href={`/profiles/${encodeURIComponent(profile.userId)}`}
            className="rounded-sm border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:bg-[var(--surface-hover)]"
          >
            <h2 className="text-sm font-semibold">{profile.displayName}</h2>
            {profile.bio && (
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted-foreground)]">
                {profile.bio}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
