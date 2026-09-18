/**
 * Transactional email via Resend's REST API.
 *
 * Called with fetch rather than the SDK so there's no extra dependency, and it
 * never throws: a contact form that already saved the enquiry to the database
 * should not show the visitor an error just because the notification failed.
 *
 * Needs RESEND_API_KEY. Without it, sending is skipped and logged.
 */
type SendArgs = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail({ to, subject, html, replyTo }: SendArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — skipping send:", subject);
    return false;
  }

  // Resend's shared sender works without a verified domain, but it can only
  // deliver to the address that owns the Resend account. Set MAIL_FROM to an
  // address on your own verified domain to mail anyone.
  const from = process.env.MAIL_FROM || "wscanner <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!res.ok) {
      console.error("[email] send failed", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send threw", err);
    return false;
  }
}

/** Minimal escaping so a message body can't inject markup into the email. */
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
