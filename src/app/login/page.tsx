"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { PasswordField, PasswordRules } from "@/components/password-field";
import { isStrongPassword, MIN_PASSWORD_LENGTH } from "@/lib/password";

type Mode = "signin" | "signup" | "forgot";

const COPY: Record<Mode, { title: string; sub: string; cta: string }> = {
  signin: {
    title: "Business sign in",
    sub: "Sign in to manage your loyalty program.",
    cta: "Sign in",
  },
  signup: {
    title: "Create your account",
    sub: "We'll email you a link to confirm the address, then you can set up your business.",
    cta: "Create account",
  },
  forgot: {
    title: "Reset your password",
    sub: "Enter your email and we'll send you a reset link.",
    cta: "Send reset link",
  },
};

const input =
  "w-full rounded-lg border border-line-strong px-3 py-2 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent";

/** Seconds to wait before another confirmation email can be sent. */
const RESEND_COOLDOWN = 45;

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Set once sign-up succeeds and the address still needs confirming. */
  const [pending, setPending] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const mismatch = mode === "signup" && confirm.length > 0 && password !== confirm;
  const weak = mode === "signup" && password.length > 0 && !isStrongPassword(password);

  // Read on mount rather than with useSearchParams, which would force this
  // statically-rendered page behind a Suspense boundary.
  useEffect(() => {
    const verify = new URLSearchParams(window.location.search).get("verify");
    if (verify === "expired") {
      setError("That confirmation link has expired or was already used. Sign in, or create the account again to get a fresh link.");
    } else if (verify === "invalid") {
      setError("That link didn't look right. Try the newest email we sent you.");
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  /** Where the emailed link comes back to. */
  function confirmUrl() {
    return `${window.location.origin}/auth/confirm?next=/setup`;
  }

  function go(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
    setConfirm("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (mode === "signup") {
      if (!isStrongPassword(password)) {
        return setError("Please meet all five password rules below.");
      }
      if (password !== confirm) {
        return setError("Those two passwords don't match.");
      }
    }

    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) return setError(error.message);
      // Deliberately the same message whether or not the address exists —
      // otherwise this form tells strangers who has an account here.
      return setNotice(
        `If an account exists for ${email}, a reset link is on its way. Check your inbox (and spam).`
      );
    }

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        // Supabase says this when the address exists but was never confirmed.
        if (/confirm/i.test(error.message)) {
          setPending(email);
          setCooldown(RESEND_COOLDOWN);
          return;
        }
        return setError(error.message);
      }
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: confirmUrl() },
    });
    setLoading(false);
    if (error) return setError(error.message);

    // No session means Supabase is waiting for the address to be confirmed —
    // which is what we want. (An already-registered address comes back looking
    // the same, on purpose: this form must not reveal who has an account.)
    if (!data.session) {
      setPending(email);
      setCooldown(RESEND_COOLDOWN);
      return;
    }

    // Confirmation is switched off in the Supabase project — carry on.
    router.push("/setup");
    router.refresh();
  }

  async function resend() {
    if (!pending || cooldown > 0) return;
    setError(null);
    setNotice(null);
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pending,
      options: { emailRedirectTo: confirmUrl() },
    });
    setLoading(false);
    setCooldown(RESEND_COOLDOWN);
    if (error) return setError(error.message);
    setNotice("Sent. It can take a minute to arrive.");
  }

  /* ---------------- waiting on the emailed link ---------------- */
  if (pending) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-6">
        <div className="flex items-center justify-between py-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
            <span aria-hidden>←</span> Back to home
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 flex-col justify-center pb-16">
          <Logo size="lg" className="mb-5" />

          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
              <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
              <path d="m3.5 6.5 8.5 6 8.5-6" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold">Confirm your email</h1>
          <p className="mt-2 text-sm text-body">
            We sent a link to <strong className="break-all">{pending}</strong>. Open it and
            you&apos;ll come straight back here to set up your business.
          </p>
          <p className="mt-3 text-sm text-muted">
            Nothing yet? It can take a minute — and it sometimes lands in spam or promotions.
            The link is valid for 24 hours.
          </p>

          {error && (
            <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="mt-4 rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok" role="status">
              {notice}
            </p>
          )}

          <button
            onClick={resend}
            disabled={loading || cooldown > 0}
            className="mt-6 w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-ink disabled:opacity-60"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : loading ? "Sending…" : "Resend the email"}
          </button>

          <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm">
            <button
              onClick={() => {
                setPending(null);
                setPassword("");
                setConfirm("");
                go("signup");
              }}
              className="text-accent hover:underline"
            >
              Use a different email
            </button>
            <button
              onClick={() => {
                setPending(null);
                setPassword("");
                go("signin");
              }}
              className="text-accent hover:underline"
            >
              I&apos;ve confirmed — sign in
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------- sign in / sign up / forgot ---------------- */
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6">
      <div className="flex items-center justify-between py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
        >
          <span aria-hidden>←</span> Back to home
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex flex-1 flex-col justify-center pb-16">
        <Logo size="lg" className="mb-5" />
        <h1 className="text-2xl font-bold">{COPY[mode].title}</h1>
        <p className="mt-1 text-sm text-muted">{COPY[mode].sub}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
            />
            {mode === "signup" && (
              <p className="mt-1 text-xs text-faint">
                Use a real address — we send a confirmation link before you can continue.
              </p>
            )}
          </div>

          {mode !== "forgot" && (
            <div>
              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={mode === "signup" ? MIN_PASSWORD_LENGTH : 6}
                error={weak}
              />
              {mode === "signup" && <PasswordRules value={password} />}
            </div>
          )}

          {mode === "signup" && (
            <PasswordField
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              error={mismatch}
              hint={mismatch ? "Passwords don't match yet" : undefined}
            />
          )}

          {mode === "signin" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => go("forgot")}
                className="text-sm text-accent hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok" role="status">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || mismatch || weak}
            className="w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-ink disabled:opacity-60"
          >
            {loading ? "Please wait…" : COPY[mode].cta}
          </button>
        </form>

        <div className="mt-4 text-sm">
          {mode === "forgot" ? (
            <button onClick={() => go("signin")} className="text-accent hover:underline">
              ← Back to sign in
            </button>
          ) : (
            <button
              onClick={() => go(mode === "signin" ? "signup" : "signin")}
              className="text-accent hover:underline"
            >
              {mode === "signin"
                ? "New here? Create an account"
                : "Already have an account? Sign in"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
