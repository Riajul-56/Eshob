"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { PasswordField } from "@/components/password-field";

type Mode = "signin" | "signup" | "forgot";

const COPY: Record<Mode, { title: string; sub: string; cta: string }> = {
  signin: {
    title: "Business sign in",
    sub: "Sign in to manage your loyalty program.",
    cta: "Sign in",
  },
  signup: {
    title: "Create your account",
    sub: "Start your 3-day free trial. No card required.",
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

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mismatch = mode === "signup" && confirm.length > 0 && password !== confirm;

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

    if (mode === "signup" && password !== confirm) {
      return setError("Those two passwords don't match.");
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
      if (error) return setError(error.message);
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    if (!data.session) {
      setNotice("Account created — check your inbox to confirm your email, then sign in.");
      go("signin");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6">
      {/* top bar */}
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
          </div>

          {mode !== "forgot" && (
            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              hint={mode === "signup" ? "At least 6 characters" : undefined}
            />
          )}

          {mode === "signup" && (
            <PasswordField
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
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
            disabled={loading || mismatch}
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
