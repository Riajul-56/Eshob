import type { Metadata } from "next";
import { LegalPage, Clause } from "@/components/legal-page";
import { LEGAL, PLANS_SUMMARY } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms & Conditions · wscanner" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro={`The agreement between you and ${LEGAL.legalName} for using ${LEGAL.brand}.`}
    >
      <Clause title="1. Agreement">
        <p>
          By creating an account you agree to these terms. If you are accepting on behalf of a
          business, you confirm you are authorised to bind it. If you do not agree, do not use
          the service.
        </p>
      </Clause>

      <Clause title="2. What the service does">
        <p>
          {LEGAL.brand} provides digital loyalty stamp cards. You set a reward rule, we give you a
          QR code, and your customers scan it to collect stamps and claim rewards. You also get a
          dashboard, an optional digital menu, and analytics about your own program.
        </p>
      </Clause>

      <Clause title="3. Your account">
        <ul>
          <li>Keep your password and staff PIN confidential — activity under your account is your responsibility</li>
          <li>Give accurate business details and keep them current</li>
          <li>Tell us promptly if you believe your account has been accessed without permission</li>
        </ul>
      </Clause>

      <Clause title="4. Your customers&apos; data">
        <p>
          You decide what to collect from your customers and how to use it. You are the
          controller of that information; we process it on your behalf. You agree to:
        </p>
        <ul>
          <li>Collect and use it lawfully, with the consent your customers would expect</li>
          <li>Honour their requests to see, correct or delete their information</li>
          <li>Not use it for anything they have not agreed to, including unrelated marketing</li>
        </ul>
      </Clause>

      <Clause title="5. Acceptable use">
        <p>You may not use the service to:</p>
        <ul>
          <li>Break any law, or infringe anyone&apos;s rights</li>
          <li>Offer rewards you do not intend to honour</li>
          <li>Upload content that is unlawful, misleading, or not yours to use</li>
          <li>Probe, overload or interfere with the platform, or try to reach another business&apos;s data</li>
          <li>Resell or white-label the service without our written agreement</li>
        </ul>
        <p>We may suspend an account that breaches this section.</p>
      </Clause>

      <Clause title="6. Plans and billing">
        <p>Current plans:</p>
        <ul>
          {PLANS_SUMMARY.map((p) => (
            <li key={p.name}>
              <strong>{p.name}</strong> — {p.price}
            </li>
          ))}
        </ul>
        <ul>
          <li>Every account starts with a 3-day free trial. No card is needed to begin.</li>
          <li>
            Subscriptions renew automatically until cancelled. You can cancel any time from
            Settings → Subscription; access continues to the end of the period you have paid for.
          </li>
          <li>Payments are processed by Stripe. Prices are in Canadian dollars and exclude tax unless stated.</li>
          <li>
            &quot;Lifetime&quot; means the lifetime of the service — for as long as we operate
            {" "}{LEGAL.brand} — not a guarantee of any fixed number of years.
          </li>
          <li>We may change prices with at least 30 days&apos; notice. Existing paid periods are not affected.</li>
        </ul>
        <p>Refunds are covered by our Refund Policy.</p>
      </Clause>

      <Clause title="7. Availability">
        <p>
          We work to keep the service running but do not promise uninterrupted access. Maintenance,
          third-party outages and events outside our control can cause downtime. We do not offer a
          contractual uptime guarantee on current plans.
        </p>
      </Clause>

      <Clause title="8. Your content">
        <p>
          Your logo, menu items, reward text and images remain yours. You grant us the licence needed
          to host and display them as part of running the service. You confirm you have the right to
          use anything you upload.
        </p>
      </Clause>

      <Clause title="9. Ending the agreement">
        <p>
          You may close your account at any time. We may suspend or close an account for a serious or
          repeated breach of these terms, or for non-payment, with notice where reasonable. On closure
          you can export your customer data; after 90 days it is deleted.
        </p>
      </Clause>

      <Clause title="10. Liability">
        <p>
          The service is provided &quot;as is&quot;. To the extent the law allows, we are not liable
          for indirect or consequential loss, lost profit, or lost data. Our total liability in any
          12-month period is limited to what you paid us in that period.
        </p>
        <p>
          Nothing here limits rights you have under Canadian consumer protection law that cannot be
          limited by agreement.
        </p>
      </Clause>

      <Clause title="11. Changes to these terms">
        <p>
          We may update these terms. Significant changes will be emailed to account holders at least
          30 days before they take effect. Continuing to use the service after that means you accept them.
        </p>
      </Clause>

      <Clause title="12. Governing law">
        <p>
          These terms are governed by the laws of {LEGAL.province}, {LEGAL.country}, and the courts
          of {LEGAL.province} have jurisdiction.
        </p>
      </Clause>
    </LegalPage>
  );
}
