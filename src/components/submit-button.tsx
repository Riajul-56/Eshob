"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "./spinner";

/**
 * A submit button that shows a spinner while its form is actually running.
 *
 * `useFormStatus` reads the state of the nearest parent <form>, so this has to
 * live inside the form (it does) and the form's action has to be a function —
 * which every server action here is. Nothing is faked: the spinner appears for
 * exactly as long as the request takes, and the button disables itself so a
 * double tap can't fire the action twice.
 *
 * The label stays in the layout (hidden, not removed) and the spinner is laid
 * over it, so the button never changes size mid-click.
 *
 * Note: `relative` is baked in. Tailwind emits `.relative` after `.absolute`,
 * so a caller can't position this with `absolute` — none of them need to.
 */
export function SubmitButton({
  children,
  className = "",
  disabled = false,
  spinner = "h-4 w-4",
  overlay = true,
  title,
  "aria-label": ariaLabel,
  "aria-pressed": ariaPressed,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  /** Size classes for the spinner — shrink it on chip-sized buttons. */
  spinner?: string;
  /**
   * false for controls whose own artwork is the feedback — a switch already
   * slides when you press it, and covering that with a spinner hides the
   * answer the person is looking for. Those just dim and lock instead.
   */
  overlay?: boolean;
  title?: string;
  "aria-label"?: string;
  "aria-pressed"?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={`relative ${className} ${pending ? "cursor-wait" : ""} ${
        pending && !overlay ? "opacity-60" : ""
      }`}
    >
      {overlay ? (
        <span className={`flex items-center justify-center gap-2 ${pending ? "opacity-0" : ""}`}>
          {children}
        </span>
      ) : (
        children
      )}
      {overlay && pending && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner className={spinner} />
        </span>
      )}
    </button>
  );
}
