import { createClient } from "@/lib/supabase/server";
import { rows } from "@/lib/db";
import { approveStamp } from "@/app/actions";

type PendingStamp = {
  id: string;
  created_at: string;
  memberships: {
    customers: { name: string | null; phone: string | null; email: string | null } | null;
    campaigns: { name: string } | null;
  } | null;
};

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stamps")
    .select("id,created_at,memberships(customers(name,phone,email),campaigns(name))")
    .eq("approved", false)
    .order("created_at", { ascending: true });

  const pending = rows<PendingStamp>(data);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Stamp approvals</h1>
      <p className="mt-1 text-sm text-slate-500">
        Pending stamps from campaigns set to manual approval.
      </p>

      <div className="mt-6 space-y-3">
        {pending.length === 0 && (
          <p className="text-sm text-slate-500">Nothing waiting for approval. 🎉</p>
        )}
        {pending.map((s) => {
          const c = s.memberships?.customers;
          const who = c?.name || c?.phone || c?.email || "Customer";
          return (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <div className="font-medium">{who}</div>
                <div className="text-sm text-slate-500">
                  {s.memberships?.campaigns?.name} ·{" "}
                  {new Date(s.created_at).toLocaleString()}
                </div>
              </div>
              <form action={approveStamp.bind(null, s.id)}>
                <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-ink">
                  Approve
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
