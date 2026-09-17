"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/** Read what the no-flash script in <head> already decided. */
function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Sun/moon switch. The <head> script sets the theme before first paint, so
 * this only has to stay in sync with it and write the user's choice down.
 *
 * Note the button carries no `position` class of its own. Tailwind emits
 * `.relative` after `.absolute`, so a baked-in `relative` would win over any
 * position passed through `className` and the button could never be placed
 * absolutely by its caller. The icons get their own `relative` wrapper instead.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  // Render the light icon on the server, then correct on mount — the markup is
  // identical for both themes so there is nothing to mismatch.
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTheme(currentTheme());
    setReady(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // private mode / blocked storage — the choice just won't persist
    }
    setTheme(next);
  }

  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={`inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-line-strong text-muted transition hover:bg-elev hover:text-ink ${className}`}
    >
      {/* both icons are mounted; we cross-fade so there's no layout shift */}
      <span className="relative block h-[18px] w-[18px]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className={`absolute inset-0 h-full w-full transition-all duration-300 ${
            ready && dark ? "scale-50 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
        </svg>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`absolute inset-0 h-full w-full transition-all duration-300 ${
            ready && dark ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      </span>
    </button>
  );
}
