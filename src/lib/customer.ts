import { cookies } from "next/headers";

export const CUSTOMER_COOKIE = "loyalty_cid";

/** The current customer's id, from the httpOnly cookie set at join time. */
export async function getCustomerId(): Promise<string | null> {
  const store = await cookies();
  return store.get(CUSTOMER_COOKIE)?.value ?? null;
}
