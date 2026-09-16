import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ThemeToggle } from "@/components/theme-toggle";

type Item = {
  category: string | null;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
};

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: biz }, { data: itemData }, { data: campaign }] = await Promise.all([
    admin.from("businesses").select("name,logo_url,status").eq("id", id).maybeSingle(),
    admin
      .from("menu_items")
      .select("category,name,description,price,image_url")
      .eq("business_id", id)
      .eq("active", true)
      .order("category", { ascending: true })
      .order("created_at", { ascending: true }),
    admin
      .from("campaigns")
      .select("slug")
      .eq("business_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!biz) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-center">
        <h1 className="text-xl font-bold">Menu not found</h1>
      </main>
    );
  }

  const items = (itemData ?? []) as Item[];
  const groups = new Map<string, Item[]>();
  for (const it of items) {
    const k = it.category || "Menu";
    const arr = groups.get(k) ?? [];
    arr.push(it);
    groups.set(k, arr);
  }

  return (
    <main className="relative mx-auto min-h-screen max-w-md px-5 py-10">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="mb-6 flex flex-col items-center text-center">
        {biz.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={biz.logo_url} alt="" className="mb-2 h-16 w-16 rounded-2xl object-cover shadow-sm" />
        ) : (
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white">
            {biz.name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-xl font-bold">{biz.name}</h1>
        <div className="text-xs uppercase tracking-widest text-accent">Menu</div>
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Menu coming soon.</p>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([cat, list]) => (
            <section key={cat}>
              <h2 className="mb-2 border-b border-line pb-1 font-bold text-accent">{cat}</h2>
              <div className="space-y-3">
                {list.map((it, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {it.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image_url} alt="" className="h-14 w-14 flex-none rounded-xl object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">{it.name}</span>
                        {it.price != null && (
                          <span className="text-sm font-semibold text-body">${Number(it.price).toFixed(2)}</span>
                        )}
                      </div>
                      {it.description && <div className="text-xs text-muted">{it.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {campaign && (
        <Link
          href={`/j/${campaign.slug}`}
          className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-ink"
        >
          ◎ Collect loyalty stamps
        </Link>
      )}
    </main>
  );
}
