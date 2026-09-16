# Loyalty Platform (Eshop)

Multi-tenant SaaS — digital loyalty stamp cards for local businesses. QR-based,
no customer app. Built with **Next.js (App Router) + Supabase + Stripe**.

Full spec: see `Loyalty-SaaS-SRS.pdf` in this folder.

---

## Tech stack

| Layer      | Tech                                             |
| ---------- | ------------------------------------------------ |
| Frontend   | Next.js 15 (App Router), React 19, Tailwind CSS  |
| Backend    | Next.js Server Actions / Route Handlers          |
| Database   | Supabase (Postgres) with **Row-Level Security**  |
| Auth       | Supabase Auth                                    |
| Payments   | Stripe (added in the billing milestone)          |

---

## Setup — do these in order

### 1. Install dependencies

In the VS Code terminal, inside this folder:

```bash
npm install
```

### 2. Create a Supabase project  🔑 (you do this)

1. Go to https://supabase.com and create a free project.
2. Open **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key
3. In this folder, copy the example env file and paste your keys:

```bash
copy .env.local.example .env.local   # Windows
```

Then edit `.env.local` and fill in the three values.

### 3. Run the database migration  🔑 (you do this)

1. In the Supabase dashboard, open **SQL Editor**.
2. Open `supabase/migrations/0001_init.sql` here, copy the whole file.
3. Paste it into the SQL Editor and click **Run**.

This creates all tables and the Row-Level Security policies that keep each
business's data isolated (SRS §5).

### 4. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000 — the landing page shows a green dot once your
Supabase keys are detected.

---

## Project structure

```
src/
  app/
    layout.tsx          Root layout
    page.tsx            Landing page
    globals.css         Tailwind entry
  lib/
    supabase/
      client.ts         Browser Supabase client
      server.ts         Server Supabase client (Server Components / Actions)
      middleware.ts     Session refresh helper
middleware.ts           Runs the session refresh on every request
supabase/
  migrations/
    0001_init.sql       Schema + RLS policies
```

## Build order (from the SRS roadmap)

- [x] **M0** — Scaffold, Supabase clients, schema + RLS
- [ ] **M1** — Business: signup/login, create business, campaign CRUD, QR, dashboard
- [ ] **M2** — Customer: QR landing, join, wallet, stamp (rate-limited), PIN redemption
- [ ] **M3** — Billing: Stripe subscriptions + trial + webhooks, EN/FR, PIPEDA export/delete
- [ ] **M4** — Launch hardening + cross-tenant isolation tests

## Notes

- **Never commit `.env.local`** — it's gitignored. The `service_role` key must
  stay server-side only.
- The customer scan/join flow will use server actions (service role) because
  customers are not business members; the schema already accounts for this.
