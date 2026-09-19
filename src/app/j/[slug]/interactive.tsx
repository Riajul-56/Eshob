"use client";

import { useActionState, useRef, useState } from "react";
import { joinCampaign, collectStamp, redeemReward, type ActionState } from "./actions";
import { Spinner } from "@/components/spinner";

const initial: ActionState = { ok: false, message: "" };

const inputCls =
  "w-full rounded-xl border border-line-strong px-3 py-2.5 outline-none focus:border-accent focus:ring-1 focus:ring-accent";

function getCoords(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

function Message({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <p
      className={`rounded-lg px-3 py-2 text-center text-sm ${
        state.ok ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"
      }`}
    >
      {state.message}
    </p>
  );
}

export function JoinForm({ slug, geoRequired }: { slug: string; geoRequired: boolean }) {
  const [state, action, pending] = useActionState(joinCampaign.bind(null, slug), initial);
  const formRef = useRef<HTMLFormElement>(null);
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const captured = useRef(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (geoRequired && !captured.current) {
      e.preventDefault();
      const c = await getCoords();
      if (c && latRef.current && lngRef.current) {
        latRef.current.value = String(c.lat);
        lngRef.current.value = String(c.lng);
      }
      captured.current = true;
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} className="mt-6 space-y-3">
      <input name="name" required placeholder="Your name" className={inputCls} />
      <input name="phone" type="tel" placeholder="Phone number" className={inputCls} />
      <div className="text-center text-xs text-faint">or</div>
      <input name="email" type="email" placeholder="Email" className={inputCls} />
      <input ref={latRef} type="hidden" name="lat" />
      <input ref={lngRef} type="hidden" name="lng" />
      <Message state={state} />
      <button
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-ink disabled:opacity-60"
      >
        {pending && <Spinner />}
        {pending ? "Joining…" : "Join & get my first stamp"}
      </button>
      <p className="text-center text-xs text-faint">
        No app to download. We only use this to save your stamps.
      </p>
    </form>
  );
}

export function CollectButton({
  slug,
  approvalMode,
  geoRequired,
}: {
  slug: string;
  approvalMode: "auto" | "manual";
  geoRequired: boolean;
}) {
  const [state, action, pending] = useActionState(collectStamp.bind(null, slug), initial);
  const formRef = useRef<HTMLFormElement>(null);
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const captured = useRef(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (geoRequired && !captured.current) {
      e.preventDefault();
      const c = await getCoords();
      if (c && latRef.current && lngRef.current) {
        latRef.current.value = String(c.lat);
        lngRef.current.value = String(c.lng);
      }
      captured.current = true;
      formRef.current?.requestSubmit();
    } else {
      captured.current = false; // reset for next time
    }
  }

  // celebration after a successful auto stamp
  if (state.ok && state.message.includes("Collected")) {
    return (
      <div className="mt-6 rounded-2xl bg-ok-soft p-5 text-center">
        <div className="animate-pop mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-ok-solid text-3xl text-white">
          ✓
        </div>
        <div className="animate-float text-lg font-bold text-ok">Stamp Collected! 🎉</div>
        <div className="animate-float mt-1 inline-block rounded-full bg-ok-soft px-3 py-1 text-sm font-semibold text-ok">
          +10 XP
        </div>
        <p className="animate-float mt-2 text-xs text-ok">Come back tomorrow for your next stamp.</p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} className="mt-6 space-y-2">
      <input ref={latRef} type="hidden" name="lat" />
      <input ref={lngRef} type="hidden" name="lng" />
      <Message state={state} />
      <button
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-ink disabled:opacity-60"
      >
        {pending && <Spinner />}
        {pending ? "Adding…" : "I'm here — add my stamp"}
      </button>
      <p className="text-center text-xs text-faint">
        {approvalMode === "manual"
          ? "Stamps are confirmed by staff before they count."
          : geoRequired
          ? "One stamp per day · location checked at the store."
          : "One stamp per day."}
      </p>
    </form>
  );
}

export function RedeemForm({ slug, reward }: { slug: string; reward: string }) {
  const [state, action, pending] = useActionState(redeemReward.bind(null, slug), initial);
  const [revealed, setRevealed] = useState(false);

  // big celebration once the reward is redeemed
  if (state.ok) {
    return (
      <div className="animate-pop mt-6 rounded-2xl bg-gradient-to-br from-ok-solid to-ok p-6 text-center text-white">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-4xl">
          🎉
        </div>
        <div className="text-xl font-extrabold">Reward Redeemed!</div>
        <p className="mt-1 text-sm text-white/90">
          Enjoy your <strong>{reward}</strong> ☕
        </p>
        <p className="mt-3 text-xs text-white/70">Your card reset — start collecting again!</p>
      </div>
    );
  }

  return (
    <div className="animate-pop mt-6 rounded-2xl bg-warn-soft p-5 text-center ring-2 ring-warn-line">
      <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-warn-solid text-3xl">
        🎁
      </div>
      <div className="text-lg font-bold text-warn-strong">Reward ready to claim!</div>
      <p className="mt-1 text-sm text-warn">
        Show this screen to a staff member to get <strong>{reward}</strong>.
      </p>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="mt-3 w-full rounded-lg bg-ok-solid px-4 py-2.5 font-semibold text-white transition hover:brightness-110"
        >
          Claim reward
        </button>
      ) : (
        <form action={action} className="mt-3">
          <p className="mb-1 text-xs font-semibold text-warn-strong">
            👉 Staff only — enter your PIN to confirm
          </p>
          <div className="flex gap-2">
            <input
              name="pin"
              inputMode="numeric"
              autoFocus
              placeholder="Staff PIN"
              className="w-0 min-w-0 flex-1 rounded-lg border border-warn-line bg-card px-3 py-2 text-center outline-none focus:border-warn-solid"
            />
            <button
              disabled={pending}
              className="flex flex-none items-center justify-center gap-2 rounded-lg bg-ok-solid px-4 py-2 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {pending && <Spinner className="h-4 w-4" />}
              Confirm
            </button>
          </div>
          <p className="mt-1 text-[11px] text-warn">The customer doesn&apos;t know this PIN — it protects your rewards.</p>
        </form>
      )}
      {state.message && !state.ok && (
        <p className="mt-2 rounded-lg bg-card px-3 py-2 text-sm text-warn">{state.message}</p>
      )}
    </div>
  );
}
