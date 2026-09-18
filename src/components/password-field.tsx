"use client";

import { useId, useState } from "react";
import { passwordRules } from "@/lib/password";

/**
 * Live checklist under a new-password field. Showing every rule up front —
 * and ticking them off as they're met — beats rejecting the password after
 * the fact with a sentence nobody reads.
 */
export function PasswordRules({ value }: { value: string }) {
  const rules = passwordRules(value);
  return (
    <ul className="mt-2 grid gap-1">
      {rules.map((r) => (
        <li
          key={r.label}
          className={`flex items-center gap-2 text-xs transition-colors ${
            r.ok ? "text-ok" : value.length > 0 ? "text-muted" : "text-faint"
          }`}
        >
          <span
            aria-hidden
            className={`flex h-4 w-4 flex-none items-center justify-center rounded-full border text-[10px] ${
              r.ok ? "border-ok bg-ok-soft" : "border-line-strong"
            }`}
          >
            {r.ok ? "✓" : ""}
          </span>
          {r.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * Password input with a show/hide eye. Typing a password blind on a phone
 * keyboard is where most failed sign-ins come from, so this is not decoration.
 */
export function PasswordField({
  label,
  value,
  onChange,
  autoComplete = "current-password",
  minLength = 6,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  minLength?: number;
  hint?: string;
  error?: boolean;
}) {
  const id = useId();
  const [shown, setShown] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={shown ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 pr-11 outline-none transition focus:ring-1 ${
            error
              ? "border-danger focus:border-danger focus:ring-danger"
              : "border-line-strong focus:border-accent focus:ring-accent"
          }`}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
          title={shown ? "Hide password" : "Show password"}
          className="absolute right-1 top-1/2 flex h-8 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted transition hover:bg-elev hover:text-ink"
        >
          {shown ? (
            // eye with a slash through it
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M6.61 6.61A18.4 18.4 0 0 0 2 12s3 8 10 8a9 9 0 0 0 5.39-1.61" />
              <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24M2 2l20 20" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}
