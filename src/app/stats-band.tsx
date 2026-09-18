"use client";

import { useEffect, useRef, useState } from "react";

export type Stat = {
  /** Animated when present. */
  num?: number;
  /** Shown as-is when there's no number to count (e.g. "2 min"). */
  text?: string;
  suffix?: string;
  label: string;
};

/** 3400 -> "3.4K", 1_200_000 -> "1.2M" */
function compact(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v >= 10 || Number.isInteger(v) ? Math.round(v) : v.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v >= 10 || Number.isInteger(v) ? Math.round(v) : v.toFixed(1)}K`;
  }
  return String(Math.round(n));
}

/** Ease-out so it sprints then settles, rather than crawling linearly. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(to);
      return;
    }

    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || done.current) return;
        done.current = true;
        io.disconnect();

        const start = performance.now();
        const DURATION = 1500;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / DURATION);
          setShown(to * easeOut(p));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);

  return (
    <span ref={ref} className="tabular-nums">
      {compact(shown)}
      {/* "0+" would be nonsense, so the suffix only appears once there's
          something to add to. Keyed off the target, not the animating
          value, so it doesn't pop in halfway through the count. */}
      {to > 0 ? suffix : ""}
    </span>
  );
}

export function StatsBand({ pill, items }: { pill: string; items: Stat[] }) {
  return (
    <section className="bg-app px-5 py-12 lg:py-16">
      {/* Flat brand fill rather than a gradient — one solid block of colour
          reads as a band across the page, which is the whole point of it. */}
      <div className="reveal mx-auto max-w-5xl overflow-hidden rounded-3xl bg-brand px-6 py-10 shadow-lift sm:px-10">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur sm:text-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
            </svg>
            {pill}
          </span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 text-center sm:grid-cols-3 sm:gap-4">
          {items.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                {typeof s.num === "number" ? (
                  <CountUp to={s.num} suffix={s.suffix} />
                ) : (
                  <>
                    {s.text}
                    {s.suffix}
                  </>
                )}
              </div>
              <div className="mt-1.5 text-sm text-white/70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
