import { redirect } from "next/navigation";
import { getCurrentUserAndBusiness } from "@/lib/business";
import { createBusiness } from "@/app/actions";

export default async function SetupPage() {
  const { user, businessId } = await getCurrentUserAndBusiness();
  if (!user) redirect("/login");
  if (businessId) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <span className="mb-2 font-mono text-xs uppercase tracking-widest text-accent">
        Step 1 of 2
      </span>
      <h1 className="text-2xl font-bold">Set up your business</h1>
      <p className="mt-1 text-sm text-muted">
        Tell us who you are. You can change this anytime.
      </p>

      <form action={createBusiness} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Business name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="e.g. Maple Café"
            className="w-full rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium">
            Category <span className="text-faint">(optional)</span>
          </label>
          <input
            id="category"
            name="category"
            placeholder="Café, Salon, Gym…"
            className="w-full rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-ink"
        >
          Create business
        </button>
      </form>
    </main>
  );
}
