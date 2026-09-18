import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndBusiness } from "@/lib/business";
import { createClient } from "@/lib/supabase/server";
import { syncFromStripe } from "@/lib/billing-sync";
import { signOut } from "@/app/actions";
import { SidebarNav, BottomNav } from "./nav";
import { ThemeToggle } from "@/components/theme-toggle";

type SubRow = {
  status: string;
  trial_ends_at: string | null;
  plan: string | null;
  stripe_customer_id: string | null;
};

/** True when we'd warn the owner their access is lapsing. */
function needsWarning(sub: SubRow): boolean {
  if (sub.status === "past_due" || sub.status === "canceled") return true;
  // Only an *unsubscribed* trial can run out; a paid plan's trial rolls into billing.
  return (
    sub.status === "trialing" &&
    !sub.plan &&
    sub.trial_ends_at !== null &&
    new Date(sub.trial_ends_at).getTime() < Date.now()
  );
}

function BillingBanner({ sub }: { sub: SubRow }) {
  const { status } = sub;
  const trialOver = status === "trialing";

  let msg: string | null = null;
  if (status === "past_due") {
    msg = "Your last payment failed. Update your card to keep your account active.";
  } else if (status === "canceled") {
    msg = "Your subscription has ended. Choose a plan to keep using wscanner.";
  } else if (trialOver) {
    msg = "Your free trial has ended. Pick a plan to keep collecting stamps.";
  }
  if (!msg) return null;

  return (
    <div className="border-b border-warn-line bg-warn-soft px-4 py-2.5 text-sm text-warn">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <span>⚠️ {msg}</span>
        <Link
          href="/dashboard/settings#subscription"
          className="flex-none rounded-lg bg-warn-solid px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
        >
          Manage plan
        </Link>
      </div>
    </div>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, business, businessId } = await getCurrentUserAndBusiness();
  if (!user) redirect("/login");
  if (!businessId) redirect("/setup");

  const supabase = await createClient();
  const cols = "status,trial_ends_at,plan,stripe_customer_id";
  let { data: sub } = await supabase
    .from("subscriptions")
    .select(cols)
    .eq("business_id", businessId)
    .maybeSingle();

  // About to warn someone who may in fact have paid? Our row could be stale
  // (a missed webhook). Check with Stripe first, then re-read.
  if (sub && needsWarning(sub as SubRow) && (sub as SubRow).stripe_customer_id) {
    await syncFromStripe(businessId);
    const { data: fresh } = await supabase
      .from("subscriptions")
      .select(cols)
      .eq("business_id", businessId)
      .maybeSingle();
    sub = fresh ?? sub;
  }

  const initial = (business?.name ?? "B").charAt(0).toUpperCase();
  const logo = business?.logo_url;

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto flex max-w-6xl">
        {/* desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-line bg-card p-5 sm:flex">
          <div className="mb-6 flex items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="h-10 w-10 flex-none rounded-xl object-cover" />
            ) : (
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand font-bold text-white">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate font-bold">{business?.name ?? "Business"}</div>
              <div className="truncate text-xs text-muted">
                {business?.category ?? "Dashboard"}
              </div>
            </div>
          </div>
          <SidebarNav />
          <div className="mt-auto flex items-center gap-2 pt-4">
            <form action={signOut} className="min-w-0 flex-1">
              <button className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm text-body hover:bg-elev">
                Sign out
              </button>
            </form>
            <ThemeToggle />
          </div>
        </aside>

        {/* main */}
        <div className="min-w-0 flex-1 pb-20 sm:pb-0">
          {/* mobile top bar */}
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-card px-4 py-3 sm:hidden">
            <div className="flex items-center gap-2">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
                  {initial}
                </div>
              )}
              <span className="font-bold">{business?.name ?? "Dashboard"}</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle className="h-8 w-8" />
              <form action={signOut}>
                <button className="text-xs text-muted">Sign out</button>
              </form>
            </div>
          </header>

          {sub && needsWarning(sub as SubRow) && <BillingBanner sub={sub as SubRow} />}
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
