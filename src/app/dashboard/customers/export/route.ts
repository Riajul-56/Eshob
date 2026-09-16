import { createClient } from "@/lib/supabase/server";
import { rows as toRows } from "@/lib/db";

export const runtime = "nodejs";

type Row = {
  stamp_count: number;
  last_stamp_at: string | null;
  created_at: string;
  customers: { name: string | null; phone: string | null; email: string | null } | null;
  campaigns: { name: string; stamps_required: number } | null;
};

/** GET /dashboard/customers/export -> CSV of this business's customers (PIPEDA export). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: member } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) return new Response("No business", { status: 400 });

  const { data } = await supabase
    .from("memberships")
    .select("stamp_count,last_stamp_at,created_at,customers(name,phone,email),campaigns(name,stamps_required)")
    .eq("business_id", member.business_id);

  const rows = toRows<Row>(data);
  const header = ["Name", "Phone", "Email", "Campaign", "Stamps", "Required", "Last visit", "Joined"];
  const lines = [header];
  for (const m of rows) {
    lines.push([
      m.customers?.name ?? "",
      m.customers?.phone ?? "",
      m.customers?.email ?? "",
      m.campaigns?.name ?? "",
      String(m.stamp_count),
      String(m.campaigns?.stamps_required ?? ""),
      m.last_stamp_at ?? "",
      m.created_at ?? "",
    ]);
  }

  const csv = lines
    .map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
