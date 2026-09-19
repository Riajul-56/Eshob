"use client";

import { useEffect, useState } from "react";

/**
 * Asking for a Google review.
 *
 * Two pieces: a button that's always on the card and catches the eye, and a
 * prompt that appears once, at the moment a customer has just been handed
 * something free — which is when people actually feel like saying something
 * nice.
 *
 * Deliberately NOT done here: making the reward conditional on a review, or
 * hiding the link from anyone who looks unhappy. Both break Google's review
 * policy and can get a business's reviews wiped. The ask is the same for
 * everyone, and nothing is promised in return.
 */

function Stars({ className = "text-base" }: { className?: string }) {
  return (
    <span className={`review-stars inline-flex gap-0.5 ${className}`} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} style={{ animationDelay: `${i * 90}ms` }}>
          ★
        </span>
      ))}
    </span>
  );
}

/** The always-visible button on the loyalty card. */
export function ReviewButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="review-cta relative mt-3 flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-warn-solid px-4 py-3.5 font-bold text-warn-strong shadow-md transition hover:brightness-105 dark:text-warn-soft"
    >
      <Stars />
      <span>Rate us on Google</span>
      <span aria-hidden>→</span>
    </a>
  );
}

const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

/**
 * The one-time prompt, shown a beat after a reward is redeemed.
 *
 * "Maybe later" backs off for a month; going to Google means we never ask
 * again on this phone. If storage is unavailable (private mode), it simply
 * shows once and doesn't crash.
 */
export function ReviewPrompt({
  href,
  slug,
  business,
  reward,
}: {
  href: string;
  slug: string;
  business: string;
  reward: string;
}) {
  const [open, setOpen] = useState(false);
  const key = `wsc.review.${slug}`;

  useEffect(() => {
    let snoozed = 0;
    try {
      const raw = localStorage.getItem(key);
      if (raw === "done") return;
      snoozed = raw ? Number(raw) || 0 : 0;
    } catch {
      // private mode — fall through and just ask this once
    }
    if (snoozed && Date.now() - snoozed < DAYS_30) return;

    // Let the "Reward Redeemed!" celebration land first.
    const t = setTimeout(() => setOpen(true), 1400);
    return () => clearTimeout(t);
  }, [key]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && later();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function remember(value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // nothing to do — worst case they see it again next time
    }
  }

  function later() {
    remember(String(Date.now()));
    setOpen(false);
  }

  function went() {
    remember("done");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-title"
      onClick={later}
    >
      <div
        className="animate-pop w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-warn-soft">
          <Stars className="text-sm text-warn-solid" />
        </div>

        <h2 id="review-title" className="text-lg font-extrabold">
          Enjoying your {reward}?
        </h2>
        <p className="mt-1.5 text-sm text-body">
          A quick review helps {business} more than you&apos;d think — it takes about
          20 seconds.
        </p>

        <a
          href={href}
          target="_blank"
          rel="noopener"
          onClick={went}
          className="review-cta relative mt-5 flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-warn-solid px-4 py-3.5 font-bold text-warn-strong shadow-md transition hover:brightness-105 dark:text-warn-soft"
        >
          <Stars />
          <span>Rate us on Google</span>
        </a>

        <button
          type="button"
          onClick={later}
          className="mt-3 w-full rounded-xl px-4 py-2 text-sm font-medium text-muted hover:bg-elev"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
