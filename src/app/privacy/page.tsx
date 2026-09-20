import type { Metadata } from "next";
import { LegalPage, Clause } from "@/components/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy Policy · wscanner" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`How ${LEGAL.brand} collects, uses and protects personal information, in line with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA).`}
    >
      <Clause title="1. Who we are">
        <p>
          {LEGAL.brand} is operated by {LEGAL.legalName}, {LEGAL.address}.
        </p>
        <p>
          The person accountable for personal information here is{" "}
          <strong>{LEGAL.privacyOfficer}</strong>, Privacy Officer. Reach them at{" "}
          <strong>{LEGAL.email}</strong> or {LEGAL.phone}.
        </p>
        <p>
          We serve two groups: <strong>businesses</strong> who run a loyalty program with
          us, and their <strong>customers</strong> who collect stamps. This policy covers both.
        </p>
      </Clause>

      <Clause title="2. What we collect">
        <p>From a business owner, when you create an account:</p>
        <ul>
          <li>Email address and password (the password is stored only as a secure hash)</li>
          <li>Business name, category, logo, phone, address, opening hours</li>
          <li>Optional store location coordinates, if you choose to enable scan verification</li>
          <li>Billing details, handled by Stripe — we never see or store your card number</li>
        </ul>
        <p>From a customer, when they join a loyalty card:</p>
        <ul>
          <li>Name, and phone number or email — whatever the business asks for</li>
          <li>Stamp and reward history for that business</li>
          <li>
            Approximate location <em>at the moment of a scan</em>, only if the business has
            turned on location verification, and only to check the scan happened at the
            store. We do not keep a location trail.
          </li>
          <li>A device identifier stored in your browser so your card is recognised on your next visit</li>
          <li>
            Basic technical data your browser sends with every request — IP address, browser and
            device type — which our hosting and database providers log to keep the service running
            and to block abuse such as someone farming stamps
          </li>
        </ul>
        <p>
          We never receive your card number. Payment details are entered on Stripe&apos;s own
          checkout page and held by Stripe.
        </p>
      </Clause>

      <Clause title="3. Why we collect it">
        <p>
          To run the service you asked for: keeping stamp counts, issuing rewards, showing a
          business its own analytics, taking subscription payments, and answering support
          messages. We do not sell personal information, and we do not use it for advertising.
        </p>
      </Clause>

      <Clause title="4. Where it is stored">
        <p>
          Data is held in Supabase (PostgreSQL) in the <strong>Canada Central</strong> region.
          Access is restricted per business by row-level security, so one business can never read
          another&apos;s customers.
        </p>
        <p>We share data only with the providers that make the service work:</p>
        <ul>
          <li><strong>Supabase</strong> — database, authentication and file storage</li>
          <li><strong>Stripe</strong> — subscription payments</li>
          <li><strong>Vercel</strong> — application hosting</li>
          <li><strong>Resend</strong> — transactional email</li>
        </ul>
        <p>
          Some of these process data outside Canada, which means it may be subject to the laws
          of those countries.
        </p>
      </Clause>

      <Clause title="5. How long we keep it">
        <p>
          Business account data is kept while the account is active and for up to 90 days after
          closure, so it can be restored if you change your mind. Customer stamp records are kept
          while the business&apos;s program runs, or until the business or the customer asks us to
          delete them. Records we must keep for tax or accounting are held as long as the law requires.
        </p>
      </Clause>

      <Clause title="6. Your rights">
        <p>Under PIPEDA you may ask us to:</p>
        <ul>
          <li>Tell you what personal information we hold about you</li>
          <li>Correct anything inaccurate</li>
          <li>Delete your information, where we are not required to keep it</li>
          <li>Give you a copy in a portable format</li>
          <li>Withdraw consent, which may mean we can no longer provide the service</li>
        </ul>
        <p>
          Email {LEGAL.email} and we&apos;ll respond within 30 days. Business owners can also export
          their customer list from the dashboard at any time.
        </p>
        <p>
          If you are a customer of a business using our platform, that business decides what to
          collect and how to use it. Ask them first; we will help them act on your request.
        </p>
      </Clause>

      <Clause title="7. Security">
        <p>
          Traffic is encrypted in transit (HTTPS), passwords are hashed, and access to customer
          data is scoped to the owning business at the database level. No system is perfectly
          secure, but if a breach ever puts you at real risk of significant harm we will notify
          you and the Privacy Commissioner of Canada as PIPEDA requires.
        </p>
      </Clause>

      <Clause title="8. Cookies">
        <p>
          We use only what the service needs: a session cookie to keep you signed in, and a local
          identifier so a customer&apos;s loyalty card is remembered on their device. No advertising
          or third-party tracking cookies.
        </p>
      </Clause>

      <Clause title="9. Children">
        <p>
          The service is intended for businesses and adult customers. We do not knowingly collect
          information from children under 13. If you believe we have, contact us and we will delete it.
        </p>
      </Clause>

      <Clause title="10. Changes">
        <p>
          If we change this policy we will update the date above, and tell account holders by email
          when the change is significant.
        </p>
      </Clause>
    </LegalPage>
  );
}
