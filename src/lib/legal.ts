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
  /**
   * The legal entity behind the service. A sole proprietor trading under their
   * own name IS the business, so this is a person, not a company.
   */
  legalName: "Fahim Muktadir Mahbub",
  /** Where you're registered — sets which courts and laws apply. */
  province: "British Columbia",
  country: "Canada",
  /** Business mailing address. */
  address: "7705 112 St, Delta, BC V4C 4V9",
  email: "support@wscanner.ca",
  phone: "+1 647 858 6669",
  /**
   * PIPEDA requires a named individual accountable for personal information —
   * a role alone isn't enough. Put the owner's real name here.
   */
  privacyOfficer: "Fahim Muktadir Mahbub",
  /** Bump this whenever you change the wording. */
  updated: "20 September 2026",
} as const;

/**
 * Set to true ONLY once the business is actually registered for GST/HST.
 * Charging or advertising tax without a number is an offence, so this stays
 * false until the owner confirms registration — then flip it and the "+ tax"
 * wording appears wherever prices are shown.
 */
export const TAX_REGISTERED = false;

export const PLANS_SUMMARY = [
  { name: "Monthly", price: "$20 CAD / month" },
  { name: "Yearly", price: "$150 CAD / year" },
  { name: "Lifetime", price: "$250 CAD one-time" },
];
