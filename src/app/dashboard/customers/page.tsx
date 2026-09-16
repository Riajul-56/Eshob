import Link from "next/link";
import { getCurrentUserAndBusiness } from "@/lib/business";
import { createClient } from "@/lib/supabase/server";
import { rows } from "@/lib/db";
import { RemoveCustomer } from "./remove-customer";

type Membership = {
  id: string;
  stamp_count: number;
  last_stamp_at: string | null;
  created_at: string;
  customers: { name: string | null; phone: string | null; email: string | null } | null;
  campaigns: { name: string; stamps_required: number } | null;
};

type Stamp = { id: string; created_at: string; membership_id: string; approved: boolean };

function timeAgo(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "all" } = await searchParams;
  const { businessId } = await getCurrentUserAndBusiness();
  const supabase = await createClient();

  const [{ data: memData }, { data: stampData }] = await Promise.all([
    supabase
      .from("memberships")
      .select("id,stamp_count,last_stamp_at,created_at,customers(name,phone,email),campaigns(name,stamps_required)")
      .eq("business_id", businessId!)
      .order("last_stamp_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("stamps")
      .select("id,created_at,membership_id,approved")
      .eq("business_id", businessId!)
      .order("created_at", { ascending: false }),
  ]);

  const allMembers = rows<Membership>(memData);
  const stamps = rows<Stamp>(stampData);

  const stampsByMembership = new Map<string, Stamp[]>();
  for (const s of stamps) {
    const arr = stampsByMembership.get(s.membership_id) ?? [];
    arr.push(s);
    stampsByMembership.set(s.membership_id, arr);
  }

  const members = allMembers.filter((m) => {
    const req = m.campaigns?.stamps_required ?? Infinity;
    if (tab === "active") return m.stamp_count < req;
    if (tab === "completed") return m.stamp_count >= req;
    return true;
  });

  const tabs = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <a
          href="/dashboard/customers/export"
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ↓ Export
        </a>
      </div>

      {/* tabs */}
      <div className="mt-4 flex gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/customers?tab=${t.key}`}
            className={`flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium transition ${
              tab === t.key ? "bg-white text-brand-ink shadow-sm" : "text-slate-500"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* list */}
      <div className="mt-4 space-y-2">
        {members.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">No customers yet.</p>
        )}
        {members.map((m) => {
          const c = m.customers;
          const req = m.campaigns?.stamps_required ?? 0;
          const history = stampsByMembership.get(m.id) ?? [];
          const visits = history.filter((s) => s.approved).length;
          const completed = m.stamp_count >= req;
          return (
            <details key={m.id} className="group rounded-2xl border border-slate-200 bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-500">
                    {(c?.name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{c?.name || "Customer"}</div>
                    <div className="text-xs text-slate-400">{c?.phone || c?.email || "—"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-brand-ink">
                    {m.stamp_count}/{req}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">stamps</div>
                </div>
              </summary>

              <div className="border-t border-slate-100 px-4 py-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-slate-400">Total visits</div>
                    <div className="font-medium">{visits}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Last visit</div>
                    <div className="font-medium">{timeAgo(m.last_stamp_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Status</div>
                    <div className={`font-medium ${completed ? "text-emerald-600" : "text-brand-ink"}`}>
                      {completed ? "Completed" : "Active"}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Scan history
                  </div>
                  <ul className="space-y-1">
                    {history.slice(0, 10).map((s, i) => (
                      <li key={s.id} className="flex items-center justify-between text-slate-600">
                        <span>
                          #{history.length - i}{" "}
                          {!s.approved && (
                            <span className="ml-1 text-[10px] text-amber-600">pending</span>
                          )}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(s.created_at).toLocaleString()}
                        </span>
                      </li>
                    ))}
                    {history.length === 0 && (
                      <li className="text-xs text-slate-400">No scans yet.</li>
                    )}
                  </ul>
                </div>

                <RemoveCustomer id={m.id} />
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
