import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LEGAL } from "@/lib/legal";

/** Shared shell for the Terms / Privacy / Refund pages. */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 pb-20">
      <div className="flex items-center justify-between py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
        >
          <span aria-hidden>←</span> Back to home
        </Link>
        <ThemeToggle />
      </div>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-body">{intro}</p>
      <p className="mt-1 text-sm text-faint">Last updated: {LEGAL.updated}</p>

      <div className="mt-10 space-y-8">{children}</div>

      <div className="mt-12 rounded-2xl border border-line bg-card p-5 text-sm text-body">
        Questions about this page? Email{" "}
        <a href={`mailto:${LEGAL.email}`} className="font-medium text-accent hover:underline">
          {LEGAL.email}
        </a>
        .
      </div>

      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
        <Link href="/terms" className="hover:text-body">Terms &amp; Conditions</Link>
        <Link href="/privacy" className="hover:text-body">Privacy Policy</Link>
        <Link href="/refund" className="hover:text-body">Refund Policy</Link>
      </div>
    </main>
  );
}

/** One numbered section of a policy. */
export function Clause({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-2 space-y-3 text-body [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
