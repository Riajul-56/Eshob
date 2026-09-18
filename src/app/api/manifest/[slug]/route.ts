import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { row } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Per-card web manifest so a customer who installs from /j/<slug> gets an app
 * icon that opens straight to that loyalty card, named after the business.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("campaigns")
    .select("name,businesses(name,logo_url)")
    .eq("slug", slug)
    .maybeSingle();

  const biz = row<{ businesses?: { name?: string; logo_url?: string | null } | null }>(data)?.businesses;
  const name = biz?.name || "Loyalty Card";
  const logo = biz?.logo_url || null;

  // Always include the valid default PNGs so the installed app never falls back
  // to a generated letter icon. Add the business logo too (sizes "any", since we
  // don't know its exact dimensions) so it's used where the platform accepts it.
  const icons: Record<string, string>[] = [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ];
  if (logo) icons.unshift({ src: logo, sizes: "any", type: "image/png", purpose: "any" });

  const manifest = {
    name,
    short_name: name.slice(0, 12),
    start_url: `/j/${slug}`,
    scope: `/j/${slug}`,
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#D9561E",
    icons,
  };

  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=300" },
  });
}
