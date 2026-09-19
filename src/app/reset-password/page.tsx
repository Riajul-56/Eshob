"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { PasswordField, PasswordRules } from "@/components/password-field";
import { Spinner } from "@/components/spinner";
import { PendingLink } from "@/components/pending-link";
import { isStrongPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";

/**
 * Where the emailed reset link lands.
 *
 * Supabase signs the visitor in with a short-lived recovery session when they
 * follow the link, so the job here is just: wait for that session to appear,
 * then let them set a new password. Without a valid session we show the
 * "link expired" state instead of a form that could never work.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  // Created once. A fresh client on every render would be a new object each
  // time, and it's a dependency of the effect below — that's an endless loop.
  const [supabase] = useState(() => createClient());

  const [state, setState] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;
  const weak = password.length > 0 && !isStrongPassword(password);

  useEffect(() => {
    let alive = true;

    // Fires as soon as the recovery link is processed.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      if (event === "PASSWORD_RECOVERY" || session) setState("ready");
    });

    (async () => {
      // Already signed in from the link?
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (data.session) return setState("ready");

      // PKCE links arrive as ?code=… — exchange it for a session by hand in
      // case automatic detection didn't pick it up.
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!alive) return;
        if (!error) return setState("ready");
      }

      // Give the client a moment to finish reading the URL before giving up.
      setTimeout(async () => {
        if (!alive) return;
        const { data: again } = await supabase.auth.getSession();
        if (!alive) return;
        setState(again.session ? "ready" : "invalid");
      }, 1200);
    })();

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isStrongPassword(password)) return setError("Please meet all five password rules below.");
    if (password !== confirm) return setError("Those two passwords don't match.");

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return setError(error.message);

    setDone(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1600);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6">
      <div className="flex items-center justify-between py-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
        >
          <span aria-hidden>←</span> Back to sign in
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex flex-1 flex-col justify-center pb-16">
        <Logo size="lg" className="mb-5" />

        {state === "checking" && (
          <>
            <h1 className="text-2xl font-bold">Checking your link…</h1>
            <p className="mt-1 text-sm text-muted">One moment.</p>
          </>
        )}

        {state === "invalid" && (
          <>
            <h1 className="text-2xl font-bold">This link has expired</h1>
            <p className="mt-1 text-sm text-muted">
              Reset links are single-use and time-limited. Request a fresh one and it
              should arrive in a minute.
            </p>
            <PendingLink
              href="/login"
              className="mt-6 inline-block rounded-lg bg-brand px-4 py-2.5 text-center font-semibold text-white transition hover:bg-brand-ink"
            >
              Request a new link
            </PendingLink>
          </>
        )}

        {state === "ready" && !done && (
          <>
            <h1 className="text-2xl font-bold">Choose a new password</h1>
            <p className="mt-1 text-sm text-muted">
              You&apos;ll be signed in straight after.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <PasswordField
                  label="New password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  error={weak}
                />
                <PasswordRules value={password} />
              </div>
              <PasswordField
                label="Confirm new password"
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                error={mismatch}
                hint={mismatch ? "Passwords don't match yet" : undefined}
              />

              {error && (
                <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={saving || mismatch || weak}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-ink disabled:opacity-60"
              >
                {saving && <Spinner />}
                {saving ? "Saving…" : "Update password"}
              </button>
            </form>
          </>
        )}

        {done && (
          <>
            <h1 className="text-2xl font-bold">Password updated ✓</h1>
            <p className="mt-1 text-sm text-muted">Taking you to your dashboard…</p>
          </>
        )}
      </div>
    </main>
  );
}
