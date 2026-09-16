"use client";

import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => void; userChoice: Promise<unknown> };

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden || !deferred) return null;

  return (
    <button
      onClick={async () => {
        deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
      }}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand-ink hover:bg-brand/10"
    >
      📲 Add to Home Screen
    </button>
  );
}
