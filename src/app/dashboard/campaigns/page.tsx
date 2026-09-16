import Link from "next/link";
import { getCurrentUserAndBusiness } from "@/lib/business";
import { createClient } from "@/lib/supabase/server";
import { setCampaignStatus, deleteCampaign } from "@/app/actions";
import { OfferForm } from "./offer-form";

type Campaign = {
  id: string;
  slug: string;
  name: string;
  reward_text: string;
  stamps_required: number;
  reward_expiry_days: number | null;
  reward_image_url: string | null;
  status: "active" | "paused" | "archived";
};

const statusStyle: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600",
  paused: "bg-amber-50 text-amber-600",
  archived: "bg-slate-100 text-slate-500",
};

export default async function CampaignsPage() {
  const { businessId } = await getCurrentUserAndBusiness();
  const supabase = await createClient();

  const [{ data }, { data: bizRow }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id,slug,name,reward_text,stamps_required,reward_expiry_days,reward_image_url,status")
      .eq("business_id", businessId!)
      .neq("status", "archived")
      .order("created_at", { ascending: false }),
    supabase.from("businesses").select("compulsory_approval").eq("id", businessId!).single(),
  ]);

  const campaigns = (data ?? []) as Campaign[];
  const compulsory = !!bizRow?.compulsory_approval;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reward Programs</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create one or more offers. Each gets its own QR code.
          </p>
        </div>
      </div>

      {compulsory && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <span>⚠️</span>
          <span>
            <strong>Compulsory Approval is ON.</strong> Every stamp needs manual approval — even
            offers set to “Auto-approve.”{" "}
            <a href="/dashboard/settings" className="font-medium underline">
              Turn it off in Settings
            </a>{" "}
            for instant stamps.
          </span>
        </div>
      )}

      {/* existing offers */}
      <div className="mt-5 space-y-3">
        {campaigns.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No offers yet — create your first below.
          </p>
        )}
        {campaigns.map((c) => {
          const joinUrl = `${base}/j/${c.slug}`;
          const qrSrc = `/api/qr?data=${encodeURIComponent(joinUrl)}`;
          return (
            <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {c.reward_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.reward_image_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand/10 text-2xl text-brand">
                    🎁
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{c.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyle[c.status]}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    {c.stamps_required} visits → {c.reward_text}
                  </div>
                  <div className="text-xs text-slate-400">
                    Reward expires in {c.reward_expiry_days ?? "∞"} days
                  </div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrSrc} alt="QR" width={64} height={64} className="rounded-lg border border-slate-200" />
              </div>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-sm">
                <Link
                  href={`/dashboard/campaigns/${c.id}`}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </Link>
                <a
                  href={qrSrc}
                  download={`qr-${c.slug}.png`}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Download QR
                </a>
                <form action={setCampaignStatus.bind(null, c.id, c.status === "active" ? "paused" : "active")}>
                  <button className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50">
                    {c.status === "active" ? "Pause" : "Resume"}
                  </button>
                </form>
                <form action={deleteCampaign.bind(null, c.id)}>
                  <button className="rounded-lg border border-red-200 px-3 py-1.5 font-medium text-red-600 hover:bg-red-50">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {/* create new */}
      <div className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <span className="text-brand">＋</span> Add a new offer
        </h2>
        <OfferForm />
      </div>
    </div>
  );
}
