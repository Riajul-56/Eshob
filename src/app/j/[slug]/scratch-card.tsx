"use client";

import { useState } from "react";
import { revealScratch } from "./actions";

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
      <div className="animate-pop rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 p-5 text-center text-amber-950">
        <div className="text-3xl">🎉</div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-wide">You won</div>
        <div className="text-xl font-extrabold">{win.prize_label}</div>
        <p className="mt-1 text-xs text-amber-900/80">Show this to staff to claim your surprise.</p>
      </div>
    );
  }

  return (
    <button
      onClick={reveal}
      disabled={busy}
      className="w-full rounded-2xl border-2 border-dashed border-amber-400 bg-amber-100 p-5 text-center transition hover:bg-amber-200 disabled:opacity-70"
    >
      <div className="text-3xl">🎁</div>
      <div className="mt-1 font-bold text-amber-900">You got a scratch card!</div>
      <div className="text-sm text-amber-800">{busy ? "Revealing…" : "Tap to scratch & reveal your prize"}</div>
    </button>
  );
}
