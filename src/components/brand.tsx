/* eslint-disable @next/next/no-img-element */

/**
 * The wscanner mark. One component so the logo is never re-typed as a
 * character or an approximation — every surface shows the real file.
 */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <img
      src="/logo-mark.png"
      alt=""
      aria-hidden
      className={`flex-none rounded-[22%] object-contain ${className}`}
    />
  );
}

/** Mark + wordmark, as used in the header and footer. */
export function Logo({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const mark = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={mark} />
      <span className={`font-extrabold tracking-tight ${text}`}>wscanner</span>
    </span>
  );
}
