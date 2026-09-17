import QRCode from "qrcode";

/**
 * Hero product shot: three phones in a 3D cluster with floating status cards.
 * Everything is markup + CSS (no images), and every colour is a theme token,
 * so the mock screens follow light/dark along with the rest of the site.
 */

/* ---------- shared bits ---------- */

function Phone({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative w-[230px] rounded-[2.2rem] border-[7px] border-slate-900 bg-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-700 ${className}`}
    >
      {/* notch */}
      <div className="absolute left-1/2 top-[7px] z-10 h-[16px] w-[74px] -translate-x-1/2 rounded-full bg-slate-900 dark:bg-slate-700" />
      <div className="h-[430px] overflow-hidden rounded-[1.7rem] bg-app">{children}</div>
    </div>
  );
}

/**
 * A REAL QR code, rendered as inline SVG at build time. Faking one with random
 * dots just reads as noise at this size — and since this points at the live
 * site, it actually scans.
 *
 * Error-correction "L" keeps the module count low, which is what makes it stay
 * legible when it's only ~100px wide.
 */
async function MiniQR() {
  const target = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const svg = await QRCode.toString(target, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "L",
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return (
    <div
      className="mx-auto h-[100px] w-[100px] rounded-lg bg-white p-1.5 [&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function TabBar({ active }: { active: number }) {
  const icons = ["◫", "◎", "✦", "◷"];
  return (
    <div className="mt-auto flex items-center justify-around border-t border-line-soft bg-card px-2 py-2">
      {icons.map((ic, i) => (
        <span
          key={i}
          className={`text-[13px] ${i === active ? "text-accent" : "text-faint"}`}
        >
          {ic}
        </span>
      ))}
    </div>
  );
}

/* ---------- screen 1: business dashboard ---------- */

function DashboardScreen() {
  const stats = [
    { v: "36", l: "Scans" },
    { v: "12", l: "Customers" },
    { v: "7", l: "Rewards" },
    { v: "33%", l: "Repeat" },
  ];
  return (
    <div className="flex h-full flex-col">
      <div className="bg-gradient-to-br from-brand to-brand-ink px-3 pb-4 pt-6 text-white">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-xs font-bold">
            M
          </span>
          <div className="leading-tight">
            <div className="text-[11px] font-bold">Maple Café</div>
            <div className="text-[8px] uppercase tracking-widest text-white/70">
              Business
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1">
          {stats.map((s) => (
            <div key={s.l} className="rounded-lg bg-white/15 px-1 py-1.5 text-center">
              <div className="text-[12px] font-extrabold leading-none">{s.v}</div>
              <div className="mt-0.5 text-[6px] uppercase tracking-wide text-white/70">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-3 py-3">
        <div className="rounded-xl border border-line bg-card p-2.5">
          <div className="mb-1.5 text-[8px] font-bold uppercase tracking-widest text-faint">
            Your QR code
          </div>
          <MiniQR />
          <div className="mt-1.5 text-center text-[8px] text-muted">
            Display at your counter
          </div>
        </div>

        <div className="mt-2.5 rounded-xl border border-line bg-card p-2.5">
          <div className="mb-1.5 text-[8px] font-bold uppercase tracking-widest text-faint">
            Scans this week
          </div>
          <div className="flex h-9 items-end gap-1">
            {[40, 65, 35, 80, 55, 95, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-brand"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      <TabBar active={0} />
    </div>
  );
}

/* ---------- screen 2: customer stamp card ---------- */

function StampScreen() {
  return (
    <div className="flex h-full flex-col">
      <div className="bg-gradient-to-br from-brand to-brand-ink px-3 pb-5 pt-6 text-white">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-sm font-bold">
            M
          </span>
          <div className="leading-tight">
            <div className="text-[12px] font-bold">Maple Café</div>
            <div className="text-[8px] uppercase tracking-widest text-white/70">
              Loyalty card
            </div>
          </div>
        </div>
        <div className="mt-3 text-[17px] font-extrabold">7 of 10 stamps</div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-white" style={{ width: "70%" }} />
        </div>
      </div>

      <div className="flex-1 px-3 py-3">
        <div className="rounded-xl border border-line bg-card p-2.5">
          <div className="text-[8px] font-bold uppercase tracking-widest text-accent">
            Your next treat
          </div>
          <div className="mt-0.5 text-[11px] font-bold">Free cappuccino ☕</div>
          <div className="text-[8px] text-muted">3 more stamps to go</div>
        </div>

        <div className="mt-2.5 rounded-xl border border-line bg-card p-2.5">
          <div className="mb-2 text-[8px] font-bold uppercase tracking-widest text-faint">
            Stamp card
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center rounded-full text-[9px] font-bold ${
                  i < 7
                    ? "bg-brand text-white"
                    : "border border-dashed border-line-strong text-faint"
                }`}
              >
                {i < 7 ? "✓" : i === 9 ? "🎁" : i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* scan button */}
      <div className="relative">
        <div className="absolute -top-5 left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-brand text-base text-white shadow-lg ring-4 ring-app">
          ⛶
        </div>
        <TabBar active={1} />
      </div>
    </div>
  );
}

/* ---------- screen 3: claim reward ---------- */

function RewardScreen() {
  return (
    <div className="flex h-full flex-col">
      <div className="bg-gradient-to-br from-brand to-brand-ink px-3 pb-4 pt-6 text-center text-white">
        <div className="text-[13px] font-extrabold">Claim your reward</div>
        <div className="mt-0.5 text-[8px] text-white/75">
          Show this screen to staff
        </div>
      </div>

      <div className="flex-1 px-3 py-3">
        <div className="overflow-hidden rounded-xl border border-line bg-card">
          <div className="flex h-24 items-center justify-center bg-gradient-to-br from-warn-solid/30 to-brand/20 text-3xl">
            ☕
          </div>
          <div className="p-2.5 text-center">
            <div className="text-[8px] font-bold uppercase tracking-widest text-accent">
              Maple Café
            </div>
            <div className="mt-0.5 text-[12px] font-extrabold">
              Free cappuccino
            </div>
            <div className="mt-2 rounded-lg bg-brand py-2 text-[10px] font-bold text-white">
              CLAIM REWARD
            </div>
          </div>
        </div>

        <div className="mt-2.5 rounded-xl border border-ok-line bg-ok-soft p-2 text-center">
          <div className="text-[9px] font-bold text-ok">✓ Card complete</div>
        </div>
      </div>

      <TabBar active={2} />
    </div>
  );
}

/* ---------- floating cards ---------- */

function Badge({
  tone,
  icon,
  label,
  title,
  className = "",
  delay = "0s",
}: {
  tone: "brand" | "ok" | "warn";
  icon: string;
  label: string;
  title: string;
  className?: string;
  delay?: string;
}) {
  const chip =
    tone === "ok"
      ? "bg-ok-soft text-ok"
      : tone === "warn"
      ? "bg-warn-soft text-warn"
      : "bg-accent/15 text-accent";
  return (
    <div
      className={`badge-float absolute z-20 flex items-center gap-2.5 rounded-2xl border border-line bg-card px-3 py-2.5 shadow-lift ${className}`}
      style={{ animationDelay: delay }}
    >
      <span
        className={`flex h-8 w-8 flex-none items-center justify-center rounded-xl text-sm ${chip}`}
      >
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-[9px] font-bold uppercase tracking-widest text-faint">
          {label}
        </div>
        <div className="whitespace-nowrap text-[12px] font-bold text-ink">
          {title}
        </div>
      </div>
    </div>
  );
}

/* ---------- section ---------- */

export function PhoneShowcase() {
  return (
    <section className="relative overflow-hidden border-y border-line-soft bg-app py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-5 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight">
          One QR. Three screens. Zero apps.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-body">
          Your counter, your customer&apos;s phone, and the reward they came back
          for — all from a single code.
        </p>
      </div>

      {/* stage */}
      <div
        id="showcase-stage"
        className="reveal relative mx-auto mt-12 flex h-[470px] max-w-5xl items-center justify-center"
        style={{ perspective: "1600px" }}
      >
        <div id="showcase-cluster" className="relative flex items-center justify-center transition-transform duration-300">
          {/* left phone */}
          <div className="float-a absolute -left-[210px] hidden lg:block">
            <div style={{ transform: "rotateY(22deg) rotateZ(-6deg) scale(0.84)" }}>
              <Phone>
                <DashboardScreen />
              </Phone>
            </div>
          </div>

          {/* right phone */}
          <div className="float-c absolute -right-[210px] hidden lg:block">
            <div style={{ transform: "rotateY(-22deg) rotateZ(6deg) scale(0.84)" }}>
              <Phone>
                <RewardScreen />
              </Phone>
            </div>
          </div>

          {/* centre phone */}
          <div className="float-b relative z-10">
            <div className="aura relative">
              <Phone className="scale-[1.04]">
                <StampScreen />
              </Phone>
            </div>
          </div>

          {/* floating cards */}
          <Badge
            tone="ok"
            icon="✓"
            label="Just now"
            title="+1 stamp added"
            className="-top-2 left-[-150px] hidden sm:flex"
            delay="0.4s"
          />
          <Badge
            tone="brand"
            icon="◷"
            label="Live"
            title="Scans update instantly"
            className="right-[-130px] top-[92px] hidden sm:flex"
            delay="1.1s"
          />
          <Badge
            tone="warn"
            icon="🎁"
            label="Reward"
            title="Free coffee claimed"
            className="bottom-6 left-[-120px] hidden sm:flex"
            delay="1.8s"
          />
        </div>
      </div>
    </section>
  );
}
