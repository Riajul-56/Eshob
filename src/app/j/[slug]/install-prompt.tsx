"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/spinner";

type BIPEvent = Event & { prompt: () => void; userChoice: Promise<unknown> };

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [hidden, setHidden] = useState(false);
  const [asking, setAsking] = useState(false);

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
        setAsking(true);
        deferred.prompt();
        await deferred.userChoice;
        setAsking(false);
        setDeferred(null);
      }}
      disabled={asking}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-brand/30 bg-accent/5 px-4 py-3 text-sm font-semibold text-accent hover:bg-accent/10 disabled:opacity-60"
    >
      {asking ? <Spinner /> : "📲"} Add to Home Screen
    </button>
  );
}
