import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

/** Brand typeface. Self-hosted by Next, so no request leaves for Google. */
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-grotesk",
});

export const metadata: Metadata = {
  title: "wscanner — digital loyalty cards",
  description:
    "Digital loyalty stamp cards for cafés, salons and gyms across Canada. One QR code, no app to download.",
};

/** Paints the browser chrome (mobile address bar) to match the theme. */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#101114" },
  ],
};

/**
 * Runs before the first paint so the page never flashes the wrong theme.
 * Falls back to the OS preference until the visitor picks a side themselves.
 */
const noFlashTheme = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={grotesk.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body className="min-h-screen bg-app text-ink antialiased">{children}</body>
    </html>
  );
}
