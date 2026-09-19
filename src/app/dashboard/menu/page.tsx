import { getCurrentUserAndBusiness } from "@/lib/business";
import { createClient } from "@/lib/supabase/server";
import { deleteMenuItem, toggleMenuItem } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { MenuForm } from "./menu-form";

type Item = {
  id: string;
  category: string | null;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  active: boolean;
};

export default async function MenuPage() {
  const { businessId } = await getCurrentUserAndBusiness();
  const supabase = await createClient();

  const { data } = await supabase
    .from("menu_items")
    .select("id,category,name,description,price,image_url,active")
    .eq("business_id", businessId!)
    .order("category", { ascending: true })
    .order("created_at", { ascending: true });

  const items = (data ?? []) as Item[];
  const groups = new Map<string, Item[]>();
  for (const it of items) {
    const k = it.category || "Other";
    const arr = groups.get(k) ?? [];
    arr.push(it);
    groups.set(k, arr);
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const menuUrl = `${base}/m/${businessId}`;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Digital menu</h1>
          <p className="mt-1 text-sm text-muted">
            Customers can view this from your loyalty page.
          </p>
        </div>
        <a href={menuUrl} target="_blank" rel="noopener" className="rounded-lg border border-line-strong bg-card px-3 py-2 text-sm font-medium text-body hover:bg-app">
          Preview menu ↗
        </a>
      </div>

      {/* existing items grouped */}
      <div className="mt-5 space-y-5">
        {items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line-strong bg-card p-6 text-center text-sm text-muted">
            No menu items yet — add your first below.
          </p>
        )}
        {[...groups.entries()].map(([cat, list]) => (
          <div key={cat}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">{cat}</div>
            <div className="space-y-2">
              {list.map((it) => (
                <div key={it.id} className={`flex items-start gap-3 rounded-2xl border border-line bg-card p-3 ${!it.active ? "opacity-50" : ""}`}>
                  {it.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image_url} alt="" className="h-14 w-14 flex-none rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-elev text-xl">🍽️</div>
                  )}
                  {/* The price sits on its own line rather than beside the
                      name: on a phone there isn't room for both next to the
                      buttons, and the price was the part that got squeezed. */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{it.name}</div>
                    {it.description && <div className="truncate text-xs text-faint">{it.description}</div>}
                    {it.price != null && (
                      <div className="mt-1 text-sm font-semibold tabular-nums text-ink">
                        ${Number(it.price).toFixed(2)}
                      </div>
                    )}
                  </div>
                  {/* Stacked on a phone, side by side once there's room —
                      two buttons in a row eat ~130px a narrow screen needs. */}
                  <div className="flex flex-none flex-col gap-2 sm:flex-row">
                    <form action={toggleMenuItem.bind(null, it.id, !it.active)}>
                      <SubmitButton spinner="h-3.5 w-3.5" className="w-full rounded-lg border border-line-strong px-2.5 py-1.5 text-xs font-medium text-body hover:bg-app">
                        {it.active ? "Hide" : "Show"}
                      </SubmitButton>
                    </form>
                    <form action={deleteMenuItem.bind(null, it.id)}>
                      <SubmitButton spinner="h-3.5 w-3.5" className="w-full rounded-lg border border-danger-line px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger-soft">
                        Delete
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* add form */}
      <div className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <span className="text-accent">＋</span> Add a menu item
        </h2>
        <MenuForm />
      </div>
    </div>
  );
}
