import type { Metadata } from "next";
import { LegalPage, Clause } from "@/components/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Refund Policy · wscanner" };

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      intro="When you can get your money back, and how to ask."
    >
      <Clause title="1. Try it before you pay">
        <p>
          Every account starts with a <strong>3-day free trial</strong> and no card is required to
          begin. The best way to avoid needing a refund is to use the trial to check the service
          fits your shop.
        </p>
      </Clause>

      <Clause title="2. Monthly plan">
        <p>
          Cancel any time from Settings → Subscription. Your access continues until the end of the
          month you have paid for, and you are not charged again.
        </p>
        <p>
          We do not normally refund part of a month already started. If something went wrong on our
          side, write to us — see section 5.
        </p>
      </Clause>

      <Clause title="3. Yearly plan">
        <p>
          If you tell us within <strong>14 days</strong> of a yearly payment that you want to stop,
          we refund it in full.
        </p>
        <p>
          After 14 days the year is non-refundable, but you can cancel renewal at any time so you
          are not charged the following year.
        </p>
      </Clause>

      <Clause title="4. Lifetime plan">
        <p>
          The one-time Lifetime payment can be refunded in full within <strong>14 days</strong> of
          purchase. After that it is non-refundable, as it is a single payment for ongoing access.
        </p>
      </Clause>

      <Clause title="5. When we refund outside these windows">
        <p>We will consider a refund, in full or in part, if:</p>
        <ul>
          <li>You were charged twice, or charged after cancelling</li>
          <li>A fault on our side made the service unusable for a meaningful stretch and we could not fix it</li>
          <li>Canadian consumer protection law entitles you to one</li>
        </ul>
      </Clause>

      <Clause title="6. How to request one">
        <p>
          Email <strong>{LEGAL.email}</strong> from the address on the account, with your business
          name and roughly when you were charged, or call <strong>{LEGAL.phone}</strong>.
          We reply within 2 business days.
        </p>
        <p>
          Approved refunds go back to the original payment method through Stripe, and usually appear
          within 5–10 business days depending on your bank.
        </p>
      </Clause>

      <Clause title="7. What happens to your data">
        <p>
          After a refund your account moves to a closed state. You can export your customer list
          first; 90 days later the data is deleted. Your customers&apos; stamp cards stop working
          once the program ends, so give them notice if you can.
        </p>
      </Clause>

      <Clause title="8. Chargebacks">
        <p>
          Please contact us before raising a dispute with your bank — almost everything is faster to
          settle directly. Accounts with an open chargeback may be suspended until it is resolved.
        </p>
      </Clause>
    </LegalPage>
  );
}
