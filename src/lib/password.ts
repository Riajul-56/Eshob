/**
 * Password policy, in one place.
 *
 * The browser check below is for feedback — it tells someone *why* their
 * password was refused while they type. It is not the enforcement: that has
 * to live in Supabase (Authentication → Sign In / Providers → Password
 * Requirements), because anything checked only in the browser can be skipped
 * by calling the API directly.
 */
export const MIN_PASSWORD_LENGTH = 8;

export type Rule = { label: string; ok: boolean };

/** One rule per line, in the order they're shown under the field. */
export function passwordRules(pw: string): Rule[] {
  return [
    { label: `At least ${MIN_PASSWORD_LENGTH} characters`, ok: pw.length >= MIN_PASSWORD_LENGTH },
    { label: "An uppercase letter (A–Z)", ok: /[A-Z]/.test(pw) },
    { label: "A lowercase letter (a–z)", ok: /[a-z]/.test(pw) },
    { label: "A number (0–9)", ok: /[0-9]/.test(pw) },
    // Anything that isn't a letter, a digit or a space counts — people reach
    // for all sorts of symbols and a short allow-list only causes confusion.
    { label: "A symbol (! @ # _ … )", ok: /[^A-Za-z0-9\s]/.test(pw) },
  ];
}

export function isStrongPassword(pw: string): boolean {
  return passwordRules(pw).every((r) => r.ok);
}
