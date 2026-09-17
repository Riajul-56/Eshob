"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, esc } from "@/lib/email";

export type ContactState = { ok: boolean; message: string };

const MAX = { name: 80, email: 120, business: 80, message: 2000 };

function clean(v: FormDataEntryValue | null, max: number): string {
  return String(v ?? "").trim().slice(0, max);
}

/**
 * Store a landing-page enquiry. Writes with the service-role client because
 * `leads` has RLS on and no policies — nobody but the server can reach it.
 */
export async function submitLead(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const name = clean(formData.get("name"), MAX.name);
  const email = clean(formData.get("email"), MAX.email);
  const business = clean(formData.get("business"), MAX.business);
  const message = clean(formData.get("message"), MAX.message);

  // Bots fill in every field they find; humans never see this one.
  if (clean(formData.get("website"), 50)) {
    return { ok: true, message: "Thanks — we'll be in touch soon." };
  }

  if (!name || !email) {
    return { ok: false, message: "Please add your name and email." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, message: "That email address doesn't look right." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("leads")
    .insert({ name, email, business: business || null, message: message || null });

  if (error) {
    console.error("[lead]", error);
    return { ok: false, message: "Something went wrong — please try again." };
  }

  // Notify you. The enquiry is already saved, so a failure here is logged and
  // swallowed rather than shown to the visitor.
  const notify = process.env.LEAD_NOTIFY_EMAIL;
  if (notify) {
    await sendEmail({
      to: notify,
      replyTo: email, // hit Reply and it goes straight to them
      subject: `New enquiry — ${name}${business ? ` (${business})` : ""}`,
      html: `
        <div style="font-family:system-ui,sans-serif;line-height:1.6;color:#0f172a">
          <h2 style="margin:0 0 16px">New enquiry from your site</h2>
          <p style="margin:0"><strong>Name:</strong> ${esc(name)}</p>
          <p style="margin:0"><strong>Email:</strong> ${esc(email)}</p>
          ${business ? `<p style="margin:0"><strong>Business:</strong> ${esc(business)}</p>` : ""}
          ${
            message
              ? `<p style="margin:16px 0 4px"><strong>Message</strong></p>
                 <div style="white-space:pre-wrap;border-left:3px solid #0f766e;padding-left:12px;color:#334155">${esc(
                   message
                 )}</div>`
              : ""
          }
          <p style="margin-top:24px;font-size:12px;color:#64748b">
            Saved to your <code>leads</code> table · reply to this email to answer ${esc(name)}.
          </p>
        </div>`,
    });
  }

  return { ok: true, message: "Thanks — we'll get back to you soon." };
}
