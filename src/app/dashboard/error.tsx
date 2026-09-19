"use client";

import { useState } from "react";
import { Spinner } from "@/components/spinner";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // `reset` re-renders the segment, which can take a moment if it re-fetches.
  const [retrying, setRetrying] = useState(false);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-warn-soft text-2xl">
        ⚠️
      </div>
      <h2 className="text-lg font-bold">Something went wrong</h2>
      <p className="mt-1 text-sm text-muted">
        {error.message || "Please try again."}
      </p>
      <button
        onClick={() => {
          setRetrying(true);
          reset();
        }}
        disabled={retrying}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-ink disabled:opacity-60"
      >
        {retrying && <Spinner className="h-4 w-4" />}
        {retrying ? "Retrying…" : "Try again"}
      </button>
    </div>
  );
}
