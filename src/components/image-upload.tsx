"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Uploads an image to the Supabase "assets" bucket and stores its public URL
 * in a hidden input (so the surrounding form submits the URL). Works from
 * phone or desktop — the file picker opens the camera/gallery on mobile.
 */
export function ImageUpload({
  name,
  defaultValue = "",
  onChange,
  shape = "square",
}: {
  name: string;
  defaultValue?: string;
  onChange?: (url: string) => void;
  shape?: "square" | "wide";
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [broken, setBroken] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const box = shape === "wide" ? "h-20 w-32" : "h-20 w-20";
  const showImage = url && !broken;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr("Image must be under 5 MB.");
      return;
    }
    setBusy(true);
    setErr(null);
    setBroken(false);
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("assets")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    const { data } = supabase.storage.from("assets").getPublicUrl(path);
    setUrl(data.publicUrl);
    onChange?.(data.publicUrl);
    setBusy(false);
  }

  function clear() {
    setUrl("");
    setBroken(false);
    onChange?.("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          onError={() => setBroken(true)}
          className={`${box} rounded-xl border border-line object-cover`}
        />
      ) : (
        <div
          className={`${box} flex items-center justify-center rounded-xl border border-dashed border-line-strong text-2xl text-faint`}
        >
          🖼️
        </div>
      )}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="block text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:font-medium file:text-white hover:file:bg-brand-ink"
        />
        {busy && <p className="mt-1 text-xs text-muted">Uploading…</p>}
        {err && <p className="mt-1 text-xs text-danger">{err}</p>}
        {url && !busy && (
          <button
            type="button"
            onClick={clear}
            className="mt-1 text-xs text-muted hover:underline"
          >
            Remove
          </button>
        )}
        <input type="hidden" name={name} value={url} />
      </div>
    </div>
  );
}
