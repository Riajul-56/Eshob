import Link from "next/link";
import { getCurrentUserAndBusiness } from "@/lib/business";
import { createClient } from "@/lib/supabase/server";
import { rows } from "@/lib/db";
import { markScratchClaimed } from "@/app/actions";

type Redemption = {
  id: string;
  created_at: string;
  reward_text: string;
  memberships: {
    customers: { name: string | null; phone: string | null } | null;
  } | null;
};

type ScratchWin = {
  id: string;
  prize_label: string;
  revealed: boolean;
  claimed: boolean;
  created_at: string;
  customers: { name: string | null; phone: string | null } | null;
};

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "redeemed" } = await searchParams;
  const { businessId } = await getCurrentUserAndBusiness();
  const supabase = await createClient();

  const [{ data: redData }, pendingCount, { data: winData }] = await Promise.all([
    supabase
      .from("redemptions")
      .select("id,created_at,reward_text,memberships(customers(name,phone))")
      .eq("business_id", businessId!)
      .order("created_at", { ascending: false }),
    supabase
      .from("stamps")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId!)
      .eq("approved", false),
    supabase
      .from("scratch_wins")
      .select("id,prize_label,revealed,claimed,created_at,customers(name,phone)")
      .eq("business_id", businessId!)
      .order("created_at", { ascending: false }),
  ]);

  const redemptions = rows<Redemption>(redData);
  const pending = pendingCount.count ?? 0;
  const wins = rows<ScratchWin>(winData);
  const unclaimedWins = wins.filter((w) => !w.claimed).length;

  const tabs = [
    { key: "redeemed", label: `Redeemed (${redemptions.length})` },
    { key: "wins", label: `Scratch wins (${unclaimedWins})` },
    { key: "pending", label: `Pending (${pending})` },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Rewards</h1>
      <p className="mt-1 text-sm text-muted">
        Rewards customers have claimed, and stamps waiting for approval.
      </p>

      <div className="mt-4 flex gap-1 rounded-xl bg-elev p-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/rewards?tab=${t.key}`}
            className={`flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium transition ${
              tab === t.key ? "bg-card text-accent shadow-sm" : "text-muted"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "pending" ? (
        <div className="mt-6 rounded-2xl border border-line bg-card p-6 text-center">
          {pending > 0 ? (
            <>
              <p className="text-sm text-body">
                <strong>{pending}</strong> stamp{pending > 1 ? "s" : ""} waiting for manual
                approval.
              </p>
              <Link
                href="/dashboard/approvals"
                className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-ink"
              >
                Review approvals
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted">Nothing waiting for approval. 🎉</p>
          )}
        </div>
      ) : tab === "wins" ? (
        <div className="mt-4 space-y-2">
          {wins.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">No scratch wins yet.</p>
          )}
          {wins.map((w) => {
            const c = w.customers;
            return (
              <div key={w.id} className="flex items-center justify-between rounded-2xl border border-line bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warn-soft text-warn">🎁</div>
                  <div>
                    <div className="font-medium">{w.prize_label}</div>
                    <div className="text-xs text-faint">
                      {c?.name || c?.phone || "Customer"} · {new Date(w.created_at).toLocaleDateString()}
                      {!w.revealed && " · not scratched yet"}
                    </div>
                  </div>
                </div>
                {w.claimed ? (
                  <span className="rounded-full bg-elev px-2.5 py-1 text-[10px] font-semibold uppercase text-muted">
                    Claimed
                  </span>
                ) : (
                  <form action={markScratchClaimed.bind(null, w.id)}>
                    <button className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-ink">
                      Mark claimed
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {redemptions.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">No rewards claimed yet.</p>
          )}
          {redemptions.map((r) => {
            const c = r.memberships?.customers;
            return (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-line bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ok-soft text-ok">
                    ✓
                  </div>
                  <div>
                    <div className="font-medium">{r.reward_text}</div>
                    <div className="text-xs text-faint">
                      {c?.name || c?.phone || "Customer"} ·{" "}
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <span className="rounded-full bg-ok-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ok">
                  Redeemed
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
