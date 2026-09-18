/**
 * Business details shown on the Terms / Privacy / Refund pages.
 *
 * ⚠️ FILL THESE IN before you take real money. The pages below are a solid
 * starting point written around how this app actually works — but they are
 * not legal advice, and the bracketed values are placeholders. Have them
 * looked over by a lawyer before you go live in Canada.
 */
export const LEGAL = {
  /** Trading name shown to customers. */
  brand: "wscanner",
  /** Registered legal entity, e.g. "1234567 Ontario Inc." */
  legalName: "[Your registered business name]",
  /** Where you're registered — sets which courts and laws apply. */
  province: "[Province]",
  country: "Canada",
  /** Business mailing address. */
  address: "[Street address, City, Province, Postal code]",
  email: "support@wscanner.ca",
  phone: "+1 647 858 6669",
  /** Bump this whenever you change the wording. */
  updated: "17 September 2026",
} as const;

export const PLANS_SUMMARY = [
  { name: "Monthly", price: "$20 CAD / month" },
  { name: "Yearly", price: "$150 CAD / year" },
  { name: "Lifetime", price: "$250 CAD one-time" },
];
