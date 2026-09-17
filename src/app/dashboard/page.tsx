import Link from "next/link";
import { getCurrentUserAndBusiness } from "@/lib/business";
import { createClient } from "@/lib/supabase/server";
import { rows } from "@/lib/db";
import { approveStamp, rejectStamp } from "@/app/actions";

/* ---------- tiny inline icons ---------- */
function I({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <path d={d} />
    </svg>
  );
}
const IC = {
  scan: "M4 7V5a1 1 0 0 1 1-1h2M4 17v2a1 1 0 0 0 1 1h2M20 7V5a1 1 0 0 0-1-1h-2M20 17v2a1 1 0 0 1-1 1h-2M4 12h16",
  users: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 20v-1a4 4 0 0 0-3-3.85",
  gift: "M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8M2 7h20v5H2zM12 21V7M12 7S11 3 8.5 3 6 5 6 5s.5 2 3 2M12 7s1-4 3.5-4S18 5 18 5s-.5 2-3 2",
  trend: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  check: "M20 6 9 17l-5-5",
};

type PendingStamp = {
  id: string;
  created_at: string;
  memberships: { customers: { name: string | null; phone: string | null } | null } | null;
};
type Activity = { id: string; kind: "scan" | "reward"; who: string; when: string; text: string };

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatTile({
  icon,
  value,
  label,
  accent,
}: {
  icon: keyof typeof IC;
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-transparent bg-brand text-white" : "border-line bg-card"}`}>
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${accent ? "bg-white/20 text-white" : "bg-accent/10 text-accent"}`}>
        <I d={IC[icon]} />
      </div>
      <div className={`text-2xl font-extrabold tabular-nums ${accent ? "text-white" : "text-ink"}`}>{value}</div>
      <div className={`text-[11px] font-semibold uppercase tracking-wide ${accent ? "text-white/80" : "text-muted"}`}>{label}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 border-b border-line-soft pb-2">
      <span className="text-sm text-faint">{label}</span>
      <span className="truncate text-right text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

function StatusChip({ ok, label, neutral }: { ok: boolean; label: string; neutral?: boolean }) {
  const cls = neutral
    ? "bg-elev text-body"
    : ok
    ? "bg-ok-soft text-ok"
    : "bg-warn-soft text-warn";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      {!neutral && (ok ? "✓ " : "• ")}
      {label}
    </span>
  );
}

export default async function DashboardHome() {
  const { business, businessId } = await getCurrentUserAndBusiness();
  const supabase = await createClient();

  const [scans, redemptions, memberships, sub, pending, campaignsRes, recentStamps, recentRewards, bizInfo, branchCount] =
    await Promise.all([
      supabase.from("stamps").select("*", { count: "exact", head: true }).eq("business_id", businessId!).eq("approved", true),
      supabase.from("redemptions").select("*", { count: "exact", head: true }).eq("business_id", businessId!),
      supabase.from("memberships").select("customer_id,stamp_count").eq("business_id", businessId!),
      supabase.from("subscriptions").select("plan,status,trial_ends_at").eq("business_id", businessId!).maybeSingle(),
      supabase.from("stamps").select("id,created_at,memberships(customers(name,phone))").eq("business_id", businessId!).eq("approved", false).order("created_at", { ascending: true }).limit(5),
      supabase.from("campaigns").select("slug,name,reward_text,stamps_required").eq("business_id", businessId!).eq("status", "active").order("created_at", { ascending: false }).limit(12),
      supabase.from("stamps").select("id,created_at,memberships(customers(name))").eq("business_id", businessId!).eq("approved", true).order("created_at", { ascending: false }).limit(6),
      supabase.from("redemptions").select("id,created_at,reward_text,memberships(customers(name))").eq("business_id", businessId!).order("created_at", { ascending: false }).limit(6),
      supabase.from("businesses").select("phone,email,address,open_from,close_at,open_daily,lat,lng,allow_remote_scan,compulsory_approval,redemption_pin_hash").eq("id", businessId!).single(),
      supabase.from("branches").select("*", { count: "exact", head: true }).eq("business_id", businessId!),
    ]);

  const members = memberships.data ?? [];
  const uniqueCustomers = new Set(members.map((m) => m.customer_id)).size;
  const returning = members.filter((m) => (m.stamp_count ?? 0) >= 2).length;
  const repeatRate = members.length ? Math.round((returning / members.length) * 100) : 0;
  const pendingStamps = rows<PendingStamp>(pending.data);

  let planLabel = "Free";
  let trialNote: string | null = null;
  if (sub.data?.status === "trialing") {
    planLabel = "Trial";
    if (sub.data.trial_ends_at) {
      const days = Math.ceil((new Date(sub.data.trial_ends_at).getTime() - Date.now()) / 86400000);
      trialNote = days > 0 ? `${days} day${days > 1 ? "s" : ""} left` : "ends today";
    }
  } else if (sub.data?.plan) {
    planLabel = sub.data.plan.charAt(0).toUpperCase() + sub.data.plan.slice(1);
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const offers = (campaignsRes.data ?? []) as { slug: string; name: string; reward_text: string; stamps_required: number }[];
  const primary = offers[0] ?? null;
  const primaryQr = primary ? `/api/qr?data=${encodeURIComponent(`${base}/j/${primary.slug}`)}` : null;

  type WithCustomer = { memberships: { customers: { name: string | null } | null } | null };

  const activity: Activity[] = [
    ...rows<{ id: string; created_at: string } & WithCustomer>(recentStamps.data).map(
      (s) => ({ id: "s" + s.id, kind: "scan" as const, who: s.memberships?.customers?.name || "Customer", when: s.created_at, text: "collected a stamp" })
    ),
    ...rows<{ id: string; created_at: string; reward_text: string } & WithCustomer>(recentRewards.data).map(
      (r) => ({ id: "r" + r.id, kind: "reward" as const, who: r.memberships?.customers?.name || "Customer", when: r.created_at, text: `redeemed ${r.reward_text}` })
    ),
  ]
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
    .slice(0, 6);

  const logo = business?.logo_url;
  const bi = (bizInfo.data ?? {}) as {
    phone: string | null; email: string | null; address: string | null;
    open_from: string | null; close_at: string | null; open_daily: boolean | null;
    lat: number | null; lng: number | null;
    allow_remote_scan: boolean | null; compulsory_approval: boolean | null; redemption_pin_hash: string | null;
  };
  const branches = branchCount.count ?? 0;
  const hours = bi.open_from && bi.close_at ? `${bi.open_from} – ${bi.close_at}` : "Not set";

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* hero header */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-ink p-6 text-white">
        <div className="flex items-center gap-4">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-14 w-14 rounded-2xl border-2 border-white/30 object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold">
              {(business?.name ?? "B").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold">{business?.name}</h1>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">{planLabel}</span>
            </div>
            <p className="text-sm text-white/80">Business dashboard{trialNote ? ` · trial ${trialNote}` : ""}</p>
          </div>
        </div>
      </div>

      {/* stat tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon="scan" value={String(scans.count ?? 0)} label="Scans" />
        <StatTile icon="users" value={String(uniqueCustomers)} label="Customers" />
        <StatTile icon="gift" value={String(redemptions.count ?? 0)} label="Rewards" />
        <StatTile icon="trend" value={`${repeatRate}%`} label="Repeat" accent />
      </div>

      {/* quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/campaigns" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-ink">+ Create offer</Link>
        <Link href="/dashboard/customers" className="rounded-xl border border-line-strong bg-card px-4 py-2 text-sm font-semibold text-body hover:bg-app">View customers</Link>
        {primaryQr && <a href={primaryQr} download="qr-code.png" className="rounded-xl border border-line-strong bg-card px-4 py-2 text-sm font-semibold text-body hover:bg-app">Download QR</a>}
      </div>

      {/* business info at a glance */}
      <section className="rounded-2xl border border-line bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Business info</h2>
          <Link href="/dashboard/settings" className="text-sm font-medium text-accent hover:underline">Manage in Settings →</Link>
        </div>
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <InfoRow label="Phone" value={bi.phone || "—"} />
          <InfoRow label="Email" value={bi.email || "—"} />
          <InfoRow label="Address" value={bi.address || "—"} />
          <InfoRow label="Hours" value={bi.open_daily === false ? hours : `${hours} · daily`} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line-soft pt-4">
          <StatusChip ok={!!(bi.lat && bi.lng)} label={bi.lat && bi.lng ? "GPS set" : "No GPS"} />
          <StatusChip ok={!!bi.redemption_pin_hash} label={bi.redemption_pin_hash ? "PIN set" : "No PIN"} />
          <StatusChip ok={!!bi.allow_remote_scan} neutral label={bi.allow_remote_scan ? "Remote scan on" : "Geofenced scan"} />
          <StatusChip ok={!bi.compulsory_approval} neutral label={bi.compulsory_approval ? "Manual approval" : "Auto approval"} />
          <span className="rounded-full bg-elev px-3 py-1 text-xs font-medium text-body">{branches} branch{branches === 1 ? "" : "es"}</span>
        </div>
      </section>

      {/* pending approvals */}
      {pendingStamps.length > 0 && (
        <section className="rounded-2xl border border-warn-line bg-warn-soft/50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-warn-strong">Pending approvals</h2>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-warn-solid px-2 text-xs font-bold text-white">{pendingStamps.length}</span>
          </div>
          <div className="space-y-2">
            {pendingStamps.map((s) => {
              const c = s.memberships?.customers;
              return (
                <div key={s.id} className="flex min-w-0 items-center justify-between rounded-xl bg-card p-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c?.name || c?.phone || "Customer"}</div>
                    <div className="text-xs text-faint">{timeAgo(s.created_at)}</div>
                  </div>
                  <div className="flex gap-2">
                    <form action={rejectStamp.bind(null, s.id)}>
                      <button aria-label="Reject" className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card text-muted hover:bg-app">✕</button>
                    </form>
                    <form action={approveStamp.bind(null, s.id)}>
                      <button aria-label="Approve" className="flex h-9 w-9 items-center justify-center rounded-lg bg-ok-solid text-white transition hover:brightness-110">✓</button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* activity + QR */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent activity</h2>
            <Link href="/dashboard/customers" className="text-sm font-medium text-accent hover:underline">
              View all customers →
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-faint">No activity yet. Share your QR code to get your first scan.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-8 w-8 flex-none items-center justify-center rounded-full ${a.kind === "reward" ? "bg-ok-soft text-ok" : "bg-accent/10 text-accent"}`}>
                    <I d={a.kind === "reward" ? IC.gift : IC.check} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm"><span className="font-medium">{a.who}</span> <span className="text-muted">{a.text}</span></div>
                  </div>
                  <span className="flex-none text-xs text-faint">{timeAgo(a.when)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="mb-3 font-semibold">Your QR codes</h2>
          {offers.length > 0 ? (
            <div className="space-y-4">
              {offers.map((o) => {
                const joinUrl = `${base}/j/${o.slug}`;
                const src = `/api/qr?data=${encodeURIComponent(joinUrl)}`;
                return (
                  <div key={o.slug} className="flex min-w-0 items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" width={84} height={84} className="flex-none rounded-xl border border-line" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{o.name}</div>
                      <div className="text-xs text-muted">{o.stamps_required} stamps → {o.reward_text}</div>
                      <a
                        href={joinUrl}
                        target="_blank"
                        rel="noopener"
                        className="mt-1 block break-all font-mono text-[11px] text-accent hover:underline"
                      >
                        {joinUrl}
                      </a>
                      <a href={src} download={`qr-${o.slug}.png`} className="mt-0.5 inline-block text-xs font-medium text-muted hover:underline">
                        Download QR
                      </a>
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-faint">Print &amp; display each one at your counter.</p>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted">
              <Link href="/dashboard/campaigns" className="font-medium text-accent hover:underline">Create an offer</Link> to generate your QR code.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
