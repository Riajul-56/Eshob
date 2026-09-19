"use client";

import { useState } from "react";

/**
 * Copies a link to the clipboard and says so for a moment.
 *
 * The join URLs are long and unreadable, so the page shows a short form of
 * them — this is how the owner actually gets the whole thing to paste into a
 * bio or a WhatsApp message.
 */
export function CopyLink({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");

  async function copy() {
    try {
      // Needs HTTPS (or localhost) — it just won't be available otherwise.
      await navigator.clipboard.writeText(value);
      setState("done");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 1800);
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {state === "done" ? "✓ Copied" : state === "failed" ? "Press & hold to copy" : "Copy link"}
    </button>
  );
}
