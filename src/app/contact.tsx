"use client";

import { useActionState } from "react";
import { submitLead, type ContactState } from "./contact-action";

/* ── EDIT THESE ────────────────────────────────────────────────────────────
   Your real contact details. Leave a line blank to hide that row.          */
const CONTACT = {
  email: "riajulhasan112@gmail.com",
  phone: "",
  area: "Serving cafés, salons & gyms across Canada",
};
/* ─────────────────────────────────────────────────────────────────────── */

const field =
  "w-full rounded-xl border border-line-strong bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-1 focus:ring-accent";

function Row({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-accent/10 text-sm text-accent">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-faint">
          {label}
        </div>
        {href ? (
          <a
            href={href}
            className="block truncate text-sm font-medium text-accent hover:underline"
          >
            {value}
          </a>
        ) : (
          <div className="truncate text-sm font-medium">{value}</div>
        )}
      </div>
    </div>
  );
}

export function Contact() {
  const [state, action, pending] = useActionState<ContactState, FormData>(
    submitLead,
    { ok: false, message: "" }
  );

  return (
    <section id="contact" className="scroll-mt-16 border-t border-line-soft bg-app">
      <div className="mx-auto max-w-5xl px-5 py-16 lg:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Talk to us</h2>
          <p className="mx-auto mt-3 max-w-xl text-body">
            Questions about setup, pricing or whether this fits your shop? Send a
            note and we&apos;ll reply personally.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          {/* details */}
          <div className="space-y-5 lg:col-span-2">
            <div className="rounded-2xl border border-line bg-card p-6">
              <div className="space-y-5">
                {CONTACT.email && (
                  <Row
                    icon="✉"
                    label="Email"
                    value={CONTACT.email}
                    href={`mailto:${CONTACT.email}`}
                  />
                )}
                {CONTACT.phone && (
                  <Row
                    icon="☎"
                    label="Phone"
                    value={CONTACT.phone}
                    href={`tel:${CONTACT.phone.replace(/[^\d+]/g, "")}`}
                  />
                )}
                {CONTACT.area && <Row icon="◎" label="Coverage" value={CONTACT.area} />}
              </div>
            </div>

            <div className="rounded-2xl border border-accent/25 bg-accent/5 p-6">
              <div className="text-sm font-bold">Want a walkthrough?</div>
              <p className="mt-1 text-sm text-body">
                Mention your business type in the message and we&apos;ll set up a
                demo card for you before you sign up.
              </p>
            </div>
          </div>

          {/* form */}
          <div className="lg:col-span-3">
            <form
              action={action}
              className="rounded-2xl border border-line bg-card p-6 shadow-card"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="mb-1.5 block text-sm font-medium">
                    Your name <span className="text-danger">*</span>
                  </label>
                  <input id="c-name" name="name" required maxLength={80} className={field} />
                </div>
                <div>
                  <label htmlFor="c-email" className="mb-1.5 block text-sm font-medium">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    id="c-email"
                    name="email"
                    type="email"
                    required
                    maxLength={120}
                    className={field}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="c-business" className="mb-1.5 block text-sm font-medium">
                  Business name
                </label>
                <input
                  id="c-business"
                  name="business"
                  maxLength={80}
                  placeholder="Maple Café"
                  className={field}
                />
              </div>

              <div className="mt-4">
                <label htmlFor="c-message" className="mb-1.5 block text-sm font-medium">
                  Message
                </label>
                <textarea
                  id="c-message"
                  name="message"
                  rows={4}
                  maxLength={2000}
                  placeholder="What would you like to know?"
                  className={`${field} resize-y`}
                />
              </div>

              {/* honeypot — hidden from people, irresistible to bots */}
              <input
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />

              <button
                disabled={pending}
                className="mt-5 w-full rounded-xl bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-ink disabled:opacity-60 sm:w-auto"
              >
                {pending ? "Sending…" : "Send message"}
              </button>

              {state.message && (
                <p
                  className={`mt-3 text-sm font-medium ${
                    state.ok ? "text-ok" : "text-danger"
                  }`}
                  role="status"
                >
                  {state.ok ? "✓ " : ""}
                  {state.message}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
