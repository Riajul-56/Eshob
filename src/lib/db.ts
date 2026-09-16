/**
 * Supabase result helpers.
 *
 * When you embed a to-one relation in a select — `customers(name, phone)` —
 * supabase-js infers the column as an ARRAY, because its select parser can't
 * tell a to-one join from a to-many one. At runtime you actually get a single
 * object (or null). That mismatch makes a plain `as Row[]` cast a TypeScript
 * error ("neither type sufficiently overlaps"), which `next dev` tolerates but
 * `next build` rejects.
 *
 * These helpers re-type the result to the shape we really receive. They change
 * nothing at runtime — they only tell TypeScript what Postgres actually sent.
 */

/** Type a list result, embeds included. */
export function rows<T>(data: unknown): T[] {
  return (data ?? []) as T[];
}

/** Type a single-row result, embeds included. */
export function row<T>(data: unknown): T | null {
  return (data ?? null) as T | null;
}
