import Link from "next/link";
import { getCurrentUserAndBusiness } from "@/lib/business";
import { createClient } from "@/lib/supabase/server";
import { rows } from "@/lib/db";

type Row = { created_at: string };

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}
function shortLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function BarChart({
  data,
  color,
}: {
  data: { label: string; value: number }[];
  color: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  // show a date label every few bars (plus the last one) so 30-day view isn't crowded
  const step = Math.max(1, Math.ceil(data.length / 8));
  const showLabel = (i: number) => data.length <= 10 || i % step === 0 || i === data.length - 1;
  return (
    <div className="flex h-44 items-stretch gap-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 items-end">
            <div
              className="bar-grow w-full rounded-t transition hover:brightness-110"
              style={{
                height: `${(d.value / max) * 100}%`,
                background: color,
                minHeight: d.value ? 6 : 0,
                animationDelay: `${i * 55}ms`,
                boxShadow: d.value
                  ? "inset 0 2px 0 rgba(255,255,255,0.28), 0 4px 10px rgb(var(--shadow) / 0.18)"
                  : "none",
              }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="mt-1 h-3 text-center text-[10px] font-semibold tabular-nums text-body">
            {d.value || ""}
          </span>
          <span className="whitespace-nowrap text-center text-[8px] leading-tight text-faint">
            {showLabel(i) ? d.label : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function Stat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="text-2xl font-extrabold tabular-nums text-accent">{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-faint">{sub}</div>}
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range = "7" } = await searchParams;
  const days = range === "30" ? 30 : 7;
  const { businessId } = await getCurrentUserAndBusiness();
  const supabase = await createClient();

  const now = new Date();
  const since = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1))
  );
  const sinceIso = since.toISOString();

  const [stampsRes, redRes, memRes, topRes] = await Promise.all([
    supabase.from("stamps").select("created_at").eq("business_id", businessId!).eq("approved", true).gte("created_at", sinceIso),
    supabase.from("redemptions").select("created_at").eq("business_id", businessId!).gte("created_at", sinceIso),
    supabase.from("memberships").select("created_at,customer_id").eq("business_id", businessId!),
    supabase.from("memberships").select("stamp_count,customers(name,phone)").eq("business_id", businessId!).order("stamp_count", { ascending: false }).limit(5),
  ]);

  // build day buckets
  const buckets: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    buckets.push(dayKey(d));
  }
  const countByDay = (rows: Row[]) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = r.created_at.slice(0, 10);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return buckets.map((b) => ({ label: shortLabel(b), value: m.get(b) ?? 0 }));
  };

  const scans = (stampsRes.data ?? []) as Row[];
  const reds = (redRes.data ?? []) as Row[];
  const scanSeries = countByDay(scans);
  const redSeries = countByDay(reds);

  const newCustomers = (memRes.data ?? []).filter((m) => m.created_at >= sinceIso).length;
  const totalScans = scans.length;
  const totalReds = reds.length;
  const redemptionRate = totalScans ? Math.round((totalReds / totalScans) * 100) : 0;

  const top = rows<{
    stamp_count: number;
    customers: { name: string | null; phone: string | null } | null;
  }>(topRes.data);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Insights</h1>
          <p className="mt-1 text-sm text-muted">Your loyalty program over the last {days} days.</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-elev p-1 text-sm">
          {["7", "30"].map((r) => (
            <Link
              key={r}
              href={`/dashboard/analytics?range=${r}`}
              className={`rounded-lg px-3 py-1.5 font-medium ${range === r ? "bg-card text-accent shadow-sm" : "text-muted"}`}
            >
              {r} days
            </Link>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat value={String(totalScans)} label="Scans" />
        <Stat value={String(newCustomers)} label="New customers" />
        <Stat value={String(totalReds)} label="Rewards given" />
        <Stat value={`${redemptionRate}%`} label="Redemption rate" sub="rewards ÷ scans" />
      </div>

      {/* scans chart */}
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="mb-3 font-semibold">Daily scans</h2>
        <BarChart data={scanSeries} color="rgb(var(--brand))" />
      </section>

      {/* rewards chart */}
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="mb-3 font-semibold">Daily rewards redeemed</h2>
        <BarChart data={redSeries} color="rgb(var(--warn-solid))" />
      </section>

      {/* top customers */}
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="mb-3 font-semibold">Top customers</h2>
        {top.length === 0 ? (
          <p className="py-4 text-center text-sm text-faint">No customers yet.</p>
        ) : (
          <ol className="space-y-2">
            {top.map((t, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm font-medium">
                  {t.customers?.name || t.customers?.phone || "Customer"}
                </span>
                <span className="text-sm font-semibold tabular-nums text-accent">{t.stamp_count} stamps</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="text-center text-xs text-faint">
        Live analytics update automatically as customers scan.
      </p>
    </div>
  );
}
