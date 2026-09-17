import { createAdminClient } from "@/lib/supabase/admin";
import { StatsBand, type Stat } from "./stats-band";

/**
 * The trust band.
 *
 * The numbers are counted out of the database rather than typed in, so they
 * are always true and they grow on their own. Until there's enough real
 * activity to be worth showing, it falls back to product facts that hold on
 * day one — the section is never empty and never overstates anything.
 *
 * Raise MIN_BUSINESSES if you'd rather wait for a bigger number before
 * switching over.
 */
const MIN_BUSINESSES = 10;

/** Round down to a confident-looking floor: 1247 -> 1000, 137 -> 100, 42 -> 40. */
function floorNice(n: number): number {
  if (n >= 1000) return Math.floor(n / 1000) * 1000;
  if (n >= 100) return Math.floor(n / 100) * 100;
  if (n >= 10) return Math.floor(n / 10) * 10;
  return n;
}

const FACTS: Stat[] = [
  { text: "2", suffix: " min", label: "to set up" },
  { text: "0", label: "apps to download" },
  { text: "1", suffix: " QR", label: "for every customer" },
];

export async function LiveStats() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return <StatsBand pill="Built for Canadian small businesses" items={FACTS} />;
  }

  try {
    const admin = createAdminClient();
    const head = { count: "exact" as const, head: true };

    const [biz, stamps, rewards] = await Promise.all([
      admin.from("businesses").select("*", head).eq("status", "active"),
      admin.from("stamps").select("*", head).eq("approved", true),
      admin.from("redemptions").select("*", head),
    ]);

    const businesses = biz.count ?? 0;
    if (businesses < MIN_BUSINESSES) {
      return <StatsBand pill="Built for Canadian small businesses" items={FACTS} />;
    }

    return (
      <StatsBand
        pill="Trusted by businesses across Canada"
        items={[
          { num: floorNice(businesses), suffix: "+", label: "Active businesses" },
          { num: floorNice(stamps.count ?? 0), suffix: "+", label: "Stamps collected" },
          { num: floorNice(rewards.count ?? 0), suffix: "+", label: "Rewards redeemed" },
        ]}
      />
    );
  } catch {
    return <StatsBand pill="Built for Canadian small businesses" items={FACTS} />;
  }
}
