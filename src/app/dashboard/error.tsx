"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        onClick={reset}
        className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-ink"
      >
        Try again
      </button>
    </div>
  );
}
