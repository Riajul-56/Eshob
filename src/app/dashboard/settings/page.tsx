import Link from "next/link";
import { getCurrentUserAndBusiness } from "@/lib/business";
import { createClient } from "@/lib/supabase/server";
import { setRedemptionPin } from "@/app/actions";
import {
  updateBusinessProfile,
  setToggle,
  addBranch,
  deleteBranch,
  updateSocialLinks,
  setScratchChance,
  addScratchPrize,
  deleteScratchPrize,
} from "./actions";
import { LocationForm } from "./location";
import { ImageUpload } from "@/components/image-upload";
import { startCheckout, openBillingPortal, refreshBilling } from "./billing";
import { PLANS, type PlanKey } from "@/lib/stripe";
import { syncFromStripe } from "@/lib/billing-sync";

type Biz = {
  id: string;
  name: string;
  category: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  geofence_radius: number | null;
  open_from: string | null;
  close_at: string | null;
  open_daily: boolean | null;
  allow_remote_scan: boolean | null;
  compulsory_approval: boolean | null;
  scratch_enabled: boolean | null;
  scratch_chance: number | null;
  redemption_pin_hash: string | null;
  social_links: { instagram?: string; facebook?: string; google_review?: string } | null;
};

type Branch = { id: string; name: string; address: string | null };
type Prize = { id: string; label: string; weight: number };
type Sub = {
  plan: PlanKey | null;
  status: "trialing" | "active" | "past_due" | "canceled";
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  stripe_customer_id: string | null;
};

const input =
  "w-full rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent";

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <h2 className="font-semibold">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-muted">{desc}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Keep the prop in step with the action — adding a toggle shouldn't need an edit here. */
type ToggleField = Parameters<typeof setToggle>[0];

function Switch({
  on,
  field,
  label,
  desc,
}: {
  on: boolean;
  field: ToggleField;
  label: string;
  desc: string;
}) {
  return (
    <form action={setToggle.bind(null, field, !on)} className="flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted">{desc}</div>
      </div>
      <button
        aria-pressed={on}
        className={`relative h-6 w-11 flex-none rounded-full transition ${
          on ? "bg-brand" : "bg-line-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-card transition-all ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </form>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const { billing } = await searchParams;
  const { businessId } = await getCurrentUserAndBusiness();

  // Just back from Checkout? Reconcile with Stripe now instead of waiting on
  // the webhook, so the plan is correct the moment this page renders.
  if (billing === "success" && businessId) await syncFromStripe(businessId);

  const supabase = await createClient();

  const [{ data: bizData }, { data: branchData }, { data: prizeData }, { data: subData }] =
    await Promise.all([
      supabase.from("businesses").select("*").eq("id", businessId!).single(),
      supabase.from("branches").select("id,name,address").eq("business_id", businessId!).order("created_at"),
      supabase.from("scratch_prizes").select("id,label,weight").eq("business_id", businessId!).order("created_at"),
      supabase
        .from("subscriptions")
        .select("plan,status,trial_ends_at,current_period_end,cancel_at_period_end,stripe_customer_id")
        .eq("business_id", businessId!)
        .maybeSingle(),
    ]);

  const biz = bizData as Biz;
  const branches = (branchData ?? []) as Branch[];
  const prizes = (prizeData ?? []) as Prize[];
  const social = biz.social_links ?? {};
  const sub = (subData ?? null) as Sub | null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Profile &amp; Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage your business and account.</p>
      </div>

      {/* Business profile */}
      <Section title="Business profile">
        <form action={updateBusinessProfile} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Logo</label>
            <ImageUpload name="logo_url" defaultValue={biz.logo_url ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">Business name</label>
              <input id="name" name="name" required defaultValue={biz.name} className={input} />
            </div>
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium">Category</label>
              <input id="category" name="category" defaultValue={biz.category ?? ""} className={input} />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium">Phone</label>
              <input id="phone" name="phone" defaultValue={biz.phone ?? ""} className={input} />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
              <input id="email" name="email" type="email" defaultValue={biz.email ?? ""} className={input} />
            </div>
          </div>
          <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-ink">
            Save profile
          </button>
        </form>
      </Section>

      {/* Location & hours */}
      <Section title="Location & hours" desc="Set your address, opening hours and GPS point.">
        <LocationForm defaults={biz} />
      </Section>

      {/* Scan controls */}
      <Section title="Scan controls">
        <div className="space-y-4">
          <Switch
            on={!!biz.allow_remote_scan}
            field="allow_remote_scan"
            label="Allow remote scan"
            desc="Let customers scan from anywhere (off = must be near your GPS point)."
          />
          <div className="border-t border-line-soft" />
          <Switch
            on={!!biz.compulsory_approval}
            field="compulsory_approval"
            label="Compulsory approval"
            desc="Approve every stamp manually, for all offers."
          />
        </div>
      </Section>

      {/* Staff PIN */}
      <Section
        title="Staff redemption PIN"
        desc="Staff enter this PIN to confirm a reward. Keep it private to your team."
      >
        <div className="mb-2 text-sm">
          Status:{" "}
          {biz.redemption_pin_hash ? (
            <span className="font-medium text-ok">PIN is set ✓</span>
          ) : (
            <span className="font-medium text-warn">Not set yet</span>
          )}
        </div>
        <form action={setRedemptionPin} className="flex gap-2">
          <input
            name="pin"
            inputMode="numeric"
            required
            minLength={4}
            maxLength={8}
            pattern="[0-9]{4,8}"
            title="Enter 4 to 8 digits"
            placeholder="4–8 digit PIN"
            className={input}
          />
          <button className="flex-none rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-ink">
            {biz.redemption_pin_hash ? "Update" : "Set PIN"}
          </button>
        </form>
      </Section>

      {/* Branches */}
      <Section title="Branch locations" desc="Add extra store locations. Your main location is always active.">
        <div className="space-y-2">
          {branches.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-xl border border-line p-3">
              <div>
                <div className="font-medium">{b.name}</div>
                {b.address && <div className="text-xs text-faint">{b.address}</div>}
              </div>
              <form action={deleteBranch.bind(null, b.id)}>
                <button className="rounded-lg border border-danger-line px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-soft">
                  Remove
                </button>
              </form>
            </div>
          ))}
          {branches.length === 0 && (
            <p className="text-sm text-faint">No additional branches yet.</p>
          )}
        </div>
        <form action={addBranch} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input name="name" required placeholder="Branch name" className={input} />
          <input name="address" placeholder="Address (optional)" className={input} />
          <button className="flex-none rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-ink">
            + Add
          </button>
        </form>
      </Section>

      {/* Social links */}
      <Section title="Social links & reviews" desc="Shown to customers; the Google link powers 'Rate us on Google'.">
        <form action={updateSocialLinks} className="space-y-3">
          <div>
            <label htmlFor="google_review" className="mb-1 block text-sm font-medium">Google review link</label>
            <input id="google_review" name="google_review" defaultValue={social.google_review ?? ""} placeholder="https://g.page/…/review" className={input} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="instagram" className="mb-1 block text-sm font-medium">Instagram</label>
              <input id="instagram" name="instagram" defaultValue={social.instagram ?? ""} className={input} />
            </div>
            <div>
              <label htmlFor="facebook" className="mb-1 block text-sm font-medium">Facebook</label>
              <input id="facebook" name="facebook" defaultValue={social.facebook ?? ""} className={input} />
            </div>
          </div>
          <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-ink">
            Save links
          </button>
        </form>
      </Section>

      {/* Scratch cards */}
      <Section title="Scratch cards" desc="Give customers a random chance to win a surprise prize on a scan.">
        <Switch
          on={!!biz.scratch_enabled}
          field="scratch_enabled"
          label="Enable scratch cards"
          desc="Turn on surprise scratch-and-win prizes."
        />
        <form action={setScratchChance} className="mt-4 flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="scratch_chance" className="mb-1 block text-sm font-medium">
              Win chance per scan (%)
            </label>
            <input
              id="scratch_chance"
              name="scratch_chance"
              type="number"
              min={0}
              max={100}
              defaultValue={biz.scratch_chance ?? 20}
              className={input}
            />
          </div>
          <button className="flex-none rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-ink">
            Save
          </button>
        </form>

        <div className="mt-4">
          <div className="mb-2 text-sm font-medium">Prizes</div>
          <div className="space-y-2">
            {prizes.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-line p-3">
                <div>
                  <span className="font-medium">{p.label}</span>{" "}
                  <span className="text-xs text-faint">· odds {p.weight}</span>
                </div>
                <form action={deleteScratchPrize.bind(null, p.id)}>
                  <button className="rounded-lg border border-danger-line px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-soft">
                    Remove
                  </button>
                </form>
              </div>
            ))}
            {prizes.length === 0 && <p className="text-sm text-faint">No prizes yet — add one below.</p>}
          </div>
          <form action={addScratchPrize} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input name="label" required placeholder="Prize (e.g. Free cookie)" className={input} />
            <input name="weight" type="number" min={1} defaultValue={1} title="Relative odds" className={`${input} sm:w-24`} />
            <button className="flex-none rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-ink">
              + Add prize
            </button>
          </form>
        </div>
      </Section>

      {/* Subscription */}
      <div id="subscription" className="scroll-mt-6">
        <Section title="Subscription" desc="Manage your plan and billing.">
          <Billing sub={sub} billing={billing} />
        </Section>
      </div>
    </div>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function daysLeft(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

function Billing({ sub, billing }: { sub: Sub | null; billing?: string }) {
  const status = sub?.status ?? "trialing";
  const plan = sub?.plan ?? null;
  const lifetime = plan === "lifetime";
  const hasCustomer = !!sub?.stripe_customer_id;

  const badge: Record<Sub["status"], { text: string; cls: string }> = {
    trialing: { text: "Free trial", cls: "bg-info-soft text-info" },
    active: { text: "Active", cls: "bg-ok-soft text-ok" },
    past_due: { text: "Payment failed", cls: "bg-danger-soft text-danger" },
    canceled: { text: "No active plan", cls: "bg-elev text-body" },
  };

  let summary = "";
  if (lifetime && status === "active") {
    summary = "Lifetime access — never expires. Thank you! 🎉";
  } else if (status === "trialing") {
    const d = daysLeft(sub?.trial_ends_at ?? null);
    const ends = fmtDate(sub?.trial_ends_at ?? null);
    if (plan) {
      // already subscribed — the rest of the signup trial carried over
      summary = `${PLANS[plan].label} plan · free for ${d} more day${d === 1 ? "" : "s"}, first charge on ${ends}.`;
    } else if (sub?.trial_ends_at) {
      summary = `${d} day${d === 1 ? "" : "s"} left · trial ends ${ends}. Pick a plan below to keep going.`;
    } else {
      summary = "You're on a free trial. Pick a plan below to continue.";
    }
  } else if (status === "active") {
    summary = sub?.cancel_at_period_end
      ? `Your plan is set to cancel on ${fmtDate(sub?.current_period_end ?? null)}.`
      : sub?.current_period_end
      ? `${plan ? PLANS[plan].label : "Plan"} · renews ${fmtDate(sub.current_period_end)}.`
      : "Your subscription is active.";
  } else if (status === "past_due") {
    summary = "Your last payment failed. Update your card in the billing portal to keep your account active.";
  } else {
    summary = "No active plan. Choose one below to get started.";
  }

  return (
    <div className="space-y-4">
      {billing === "success" && (
        <div className="rounded-xl border border-ok-line bg-ok-soft p-3 text-sm text-ok">
          ✓ Checkout complete — your plan is shown below.
        </div>
      )}
      {billing === "cancel" && (
        <div className="rounded-xl border border-warn-line bg-warn-soft p-3 text-sm text-warn">
          Checkout was cancelled. No charge was made — pick a plan whenever you&apos;re ready.
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge[status].cls}`}>
          {badge[status].text}
        </span>
        {hasCustomer && (
          <div className="flex gap-2">
            <form action={refreshBilling}>
              <button
                title="Re-read your plan from Stripe"
                className="rounded-lg border border-line-strong px-3 py-1.5 text-sm font-medium hover:bg-app"
              >
                ↻ Refresh
              </button>
            </form>
            <form action={openBillingPortal}>
              <button className="rounded-lg border border-line-strong px-3 py-1.5 text-sm font-medium hover:bg-app">
                Manage billing →
              </button>
            </form>
          </div>
        )}
      </div>

      <p className="text-sm text-body">{summary}</p>

      {!lifetime && (
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(PLANS) as PlanKey[]).map((key) => {
            const p = PLANS[key];
            const current = status === "active" && plan === key;
            return (
              <form
                key={key}
                action={startCheckout.bind(null, key)}
                className={`flex flex-col rounded-2xl border p-4 ${
                  current ? "border-brand ring-1 ring-brand" : "border-line"
                }`}
              >
                <div className="font-semibold">{p.label}</div>
                <div className="mt-1">
                  <span className="text-2xl font-bold">{p.price}</span>
                  <span className="text-sm text-muted"> {p.per}</span>
                </div>
                <div className="mt-1 text-xs text-muted">{p.note}</div>
                <button
                  disabled={current}
                  className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${
                    current
                      ? "cursor-default bg-elev text-muted"
                      : "bg-brand text-white hover:bg-brand-ink"
                  }`}
                >
                  {current ? "Current plan" : status === "active" ? "Switch" : "Choose"}
                </button>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
