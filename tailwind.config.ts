import type { Config } from "tailwindcss";

/**
 * Every colour is a CSS variable holding "R G B" channels, so Tailwind's
 * opacity modifiers keep working (bg-card/80, bg-accent/15, …) AND the whole
 * palette can be swapped for dark mode by redefining the variables in
 * globals.css. Components never name a raw colour — they name a role.
 */
const c = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // surfaces
        app: c("--app"), // page background
        card: c("--card"), // panels, cards, bars
        elev: c("--elev"), // chips, hover fills, wells

        // borders
        line: {
          DEFAULT: c("--line"),
          strong: c("--line-strong"), // inputs, outlined buttons
          soft: c("--line-soft"), // dividers inside a card
        },

        // text
        ink: c("--ink"), // headings
        body: c("--body"), // paragraphs
        muted: c("--muted"), // labels, secondary
        faint: c("--faint"), // timestamps, placeholders

        // brand: `brand` fills (always dark enough for white text),
        // `accent` is the readable-on-any-background text/icon tone.
        brand: {
          DEFAULT: c("--brand"),
          ink: c("--brand-ink"), // hover / gradient end
        },
        accent: c("--accent"),

        // status
        ok: {
          DEFAULT: c("--ok"),
          soft: c("--ok-soft"),
          line: c("--ok-line"),
          solid: c("--ok-solid"),
        },
        warn: {
          DEFAULT: c("--warn"),
          strong: c("--warn-strong"),
          soft: c("--warn-soft"),
          line: c("--warn-line"),
          solid: c("--warn-solid"),
        },
        danger: {
          DEFAULT: c("--danger"),
          soft: c("--danger-soft"),
          line: c("--danger-line"),
        },
        info: {
          DEFAULT: c("--info"),
          soft: c("--info-soft"),
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--shadow) / 0.06), 0 8px 24px -12px rgb(var(--shadow) / 0.18)",
        lift: "0 12px 44px -14px rgb(var(--shadow) / 0.38)",
      },
    },
  },
  plugins: [],
};

export default config;
