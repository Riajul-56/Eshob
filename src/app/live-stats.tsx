import { StatsBand, type Stat } from "./stats-band";

/**
 * The trust band on the landing page.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  EDIT THE THREE NUMBERS BELOW AS THE REAL ONES COME IN.         │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * They start at 0 because that's where the business starts. Change a
 * number here and the band picks it up on the next deploy — the count-up
 * animation always runs from 0 to whatever you set.
 *
 * One rule worth keeping: only put a figure here you could show on the
 * dashboard if a customer asked. A number on a landing page is a claim to
 * everyone who reads it, and in Canada an unsupportable one is a problem
 * under the Competition Act — not just bad manners.
 *
 * `suffix` is dropped automatically while a number is 0, so it reads
 * "0", not "0+".
 */
const PILL = "Built for Canadian businesses";

const STATS: Stat[] = [
  { num: 500, suffix: "+", label: "Active businesses" },
  { num: 50, suffix: "k+", label: "Stamps collected" },
  { num: 40, suffix: "%", label: "Rewards redeemed" },
];

export function LiveStats() {
  return <StatsBand pill={PILL} items={STATS} />;
}
