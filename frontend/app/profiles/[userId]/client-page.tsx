"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { apiRequest, ApiError } from "@/lib/api";

type PublicProfile = {
  displayName: string;
  bio?: string;
  website?: string;
  updatedAt?: string;
};

export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = params.userId;
    if (!userId) return;
    void apiRequest<PublicProfile>(
      `/api/profiles/public/${encodeURIComponent(userId)}`,
    )
      .then(setProfile)
      .catch((loadError: unknown) => {
        setError(
          loadError instanceof ApiError || loadError instanceof Error
            ? loadError.message
            : "Could not load this profile.",
        );
      });
  }, [params.userId]);

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (!profile) {
    return <p className="text-sm text-[var(--muted-foreground)]">Loading profile…</p>;
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <Link href="/profiles" className="text-sm text-[var(--muted-foreground)] hover:underline">
        ← Back to public profiles
      </Link>
      <article className="rounded-sm border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">
          {profile.displayName}
        </h1>
        {profile.bio && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-foreground)]">
            {profile.bio}
          </p>
        )}
        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block text-sm font-medium hover:underline"
          >
            Visit website
          </a>
        )}
      </article>
    </section>
  );
}
