import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUserAndBusiness } from "@/lib/business";
import { createClient } from "@/lib/supabase/server";
import { OfferForm } from "../offer-form";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { businessId } = await getCurrentUserAndBusiness();
  const supabase = await createClient();

  const { data } = await supabase
    .from("campaigns")
    .select("id,name,reward_text,stamps_required,reward_expiry_days,stamp_validity_days,reward_image_url,approval_mode")
    .eq("id", id)
    .eq("business_id", businessId!)
    .maybeSingle();

  if (!data) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard/campaigns" className="text-sm text-brand hover:underline">
        ← Back to offers
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Edit offer</h1>
      <div className="mt-5">
        <OfferForm defaults={data} />
      </div>
    </div>
  );
}
