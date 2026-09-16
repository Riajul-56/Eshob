"use client";

import { useState } from "react";
import { addMenuItem, generateDescription } from "./actions";
import { ImageUpload } from "@/components/image-upload";

const input =
  "w-full rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent";

export function MenuForm() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);

  async function runAI() {
    setAiBusy(true);
    setAiErr(null);
    const res = await generateDescription(name, category, imageUrl || undefined);
    setAiBusy(false);
    if (res.ok && res.text) setDescription(res.text);
    else setAiErr(res.error || "Couldn't generate.");
  }

  return (
    <form action={addMenuItem} className="space-y-3 rounded-2xl border border-line bg-card p-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">Item name</label>
          <input id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Cappuccino" className={input} />
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium">Category</label>
          <input id="category" name="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Hot drinks" className={input} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-medium">Price</label>
          <input id="price" name="price" type="number" step="0.01" min={0} placeholder="4.50" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Photo <span className="text-faint">(optional)</span></label>
          <ImageUpload name="image_url" onChange={setImageUrl} />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="description" className="block text-sm font-medium">
            Description <span className="text-faint">(optional)</span>
          </label>
          <button
            type="button"
            onClick={runAI}
            disabled={aiBusy}
            className="rounded-lg border border-brand/40 bg-accent/5 px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent/10 disabled:opacity-60"
          >
            {aiBusy ? "Generating…" : "✨ Generate with AI"}
          </button>
        </div>
        <textarea
          id="description"
          name="description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write it yourself, or generate with AI"
          className={input}
        />
        {aiErr && <p className="mt-1 text-xs text-warn">{aiErr}</p>}
      </div>

      <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-ink">
        + Add item
      </button>
    </form>
  );
}
