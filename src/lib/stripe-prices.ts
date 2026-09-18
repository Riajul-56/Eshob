import { stripe, type PlanKey } from "./stripe";

/**
 * Finds the Stripe price for a plan, without trusting the environment.
 *
 * A wrong or stale STRIPE_PRICE_* value produces "No such price" at the worst
 * possible moment — the customer is already clicking Pay. So instead of taking
 * the env var on faith we:
 *
 *   1. use it if it really exists in this account,
 *   2. otherwise find our own product by its metadata tag and use its price,
 *   3. otherwise create the product and price, exactly as the setup script does.
 *
 * The result is cached per server process, so this costs one extra API call
 * after a cold start and nothing thereafter.
 */

const CURRENCY = process.env.STRIPE_CURRENCY || "cad";

type PlanDef = {
  tag: string;
  name: string;
  envVar: string;
  unit_amount: number;
  recurring?: { interval: "month" | "year" };
};

const DEFS: Record<PlanKey, PlanDef> = {
  monthly: {
    tag: "eshop_monthly",
    name: "Eshop — Monthly",
    envVar: "STRIPE_PRICE_MONTHLY",
    unit_amount: 2000,
    recurring: { interval: "month" },
  },
  yearly: {
    tag: "eshop_yearly",
    name: "Eshop — Yearly",
    envVar: "STRIPE_PRICE_YEARLY",
    unit_amount: 15000,
    recurring: { interval: "year" },
  },
  lifetime: {
    tag: "eshop_lifetime",
    name: "Eshop — Lifetime",
    envVar: "STRIPE_PRICE_LIFETIME",
    unit_amount: 25000,
  },
};

const cache = new Map<PlanKey, string>();
/** priceId -> plan, filled in as we resolve. Lets us name a plan from a price. */
const reverse = new Map<string, PlanKey>();

function remember(plan: PlanKey, priceId: string) {
  cache.set(plan, priceId);
  reverse.set(priceId, plan);
  return priceId;
}

/** Which plan does this price belong to, if we've already seen it? */
export function planFromResolved(priceId?: string | null): PlanKey | null {
  return priceId ? reverse.get(priceId) ?? null : null;
}

async function findProduct(tag: string) {
  try {
    const r = await stripe.products.search({
      query: `metadata['eshop_tag']:'${tag}'`,
      limit: 1,
    });
    if (r.data[0]) return r.data[0];
  } catch {
    // search isn't enabled on every account — fall back to listing
  }
  for await (const p of stripe.products.list({ limit: 100 })) {
    if (p.metadata?.eshop_tag === tag) return p;
  }
  return null;
}

export async function resolvePriceId(plan: PlanKey): Promise<string> {
  const cached = cache.get(plan);
  if (cached) return cached;

  const def = DEFS[plan];

  // 1. Trust the env var only after confirming it exists here.
  const fromEnv = process.env[def.envVar];
  if (fromEnv) {
    try {
      const price = await stripe.prices.retrieve(fromEnv);
      if (price && !price.deleted) return remember(plan, price.id);
    } catch {
      console.warn(
        `[stripe] ${def.envVar}=${fromEnv} isn't a price in this account — resolving "${plan}" from Stripe instead.`
      );
    }
  }

  // 2. Look for the product we tagged when it was created.
  const product = await findProduct(def.tag);
  if (product) {
    for await (const price of stripe.prices.list({
      product: product.id,
      active: true,
      limit: 100,
    })) {
      const amountMatches =
        price.unit_amount === def.unit_amount && price.currency === CURRENCY;
      const intervalMatches =
        (price.recurring?.interval ?? null) === (def.recurring?.interval ?? null);
      if (amountMatches && intervalMatches) return remember(plan, price.id);
    }
  }

  // 3. Nothing there — create it, same shape the setup script uses.
  const prod =
    product ??
    (await stripe.products.create({
      name: def.name,
      metadata: { eshop_tag: def.tag },
    }));

  const created = await stripe.prices.create({
    product: prod.id,
    currency: CURRENCY,
    unit_amount: def.unit_amount,
    ...(def.recurring ? { recurring: def.recurring } : {}),
  });

  console.warn(
    `[stripe] Created a missing ${plan} price (${created.id}). ` +
      `Set ${def.envVar}=${created.id} to skip this lookup next time.`
  );
  return remember(plan, created.id);
}
