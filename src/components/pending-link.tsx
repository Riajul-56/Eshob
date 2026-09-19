"use client";

import { useEffect, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { Spinner } from "./spinner";

/**
 * Shows the spinner only once a navigation has been running for a moment.
 *
 * Most page changes here finish in a few milliseconds. Flashing a spinner for
 * 10ms reads as a glitch, not as progress — so we wait ~140ms before admitting
 * the page is taking a while.
 */
function useSlowPending(pending: boolean, delay = 140): boolean {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!pending) {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), delay);
    return () => clearTimeout(t);
  }, [pending, delay]);

  return slow;
}

/** Must be rendered inside <Link> — that's where useLinkStatus reads from. */
function LinkBody({
  children,
  spinner,
}: {
  children: React.ReactNode;
  spinner: string;
}) {
  const { pending } = useLinkStatus();
  const busy = useSlowPending(pending);

  return (
    <>
      <span className={`flex items-center justify-center gap-2 ${busy ? "opacity-0" : ""}`}>
        {children}
      </span>
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner className={spinner} />
        </span>
      )}
    </>
  );
}

/**
 * A link that looks and behaves like the button it's styled as: tap it and it
 * shows a spinner while the next page loads.
 */
export function PendingLink({
  href,
  children,
  className = "",
  spinner = "h-4 w-4",
  prefetch,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  spinner?: string;
  prefetch?: boolean;
}) {
  return (
    <Link href={href} prefetch={prefetch} className={`relative ${className}`}>
      <LinkBody spinner={spinner}>{children}</LinkBody>
    </Link>
  );
}
