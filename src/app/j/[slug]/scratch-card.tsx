"use client";

import { useState } from "react";
import { revealScratch } from "./actions";
import { Spinner } from "@/components/spinner";

export function ScratchCard({
  slug,
  win,
}: {
  slug: string;
  win: { id: string; prize_label: string; revealed: boolean };
}) {
  const [revealed, setRevealed] = useState(win.revealed);
  const [busy, setBusy] = useState(false);

  async function reveal() {
    setBusy(true);
    await revealScratch(slug, win.id);
    setRevealed(true);
    setBusy(false);
  }

  if (revealed) {
    return (
      <div className="animate-pop rounded-2xl bg-gradient-to-br from-warn-solid to-warn p-5 text-center text-warn-strong">
        <div className="text-3xl">🎉</div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-wide">You won</div>
        <div className="text-xl font-extrabold">{win.prize_label}</div>
        <p className="mt-1 text-xs text-warn-strong/80">Show this to staff to claim your surprise.</p>
      </div>
    );
  }

  return (
    <button
      onClick={reveal}
      disabled={busy}
      className="w-full rounded-2xl border-2 border-dashed border-warn-line bg-warn-soft p-5 text-center transition hover:bg-warn-line disabled:opacity-70"
    >
      <div className="flex justify-center text-3xl">
        {busy ? <Spinner className="h-8 w-8 text-warn-strong" /> : "🎁"}
      </div>
      <div className="mt-1 font-bold text-warn-strong">You got a scratch card!</div>
      <div className="text-sm text-warn">{busy ? "Revealing…" : "Tap to scratch & reveal your prize"}</div>
    </button>
  );
}
