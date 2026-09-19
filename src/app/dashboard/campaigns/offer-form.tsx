"use client";

import { useState } from "react";
import { createCampaign, updateCampaign } from "@/app/actions";
import { ImageUpload } from "@/components/image-upload";
import { SubmitButton } from "@/components/submit-button";

/** Upper bound on a card's stamp count — mirrored in the server action. */
const MAX_STAMPS = 50;

export type OfferDefaults = {
  id?: string;
  name?: string;
  reward_text?: string;
  stamps_required?: number;
  reward_expiry_days?: number | null;
  stamp_validity_days?: number | null;
  reward_image_url?: string | null;
  approval_mode?: "auto" | "manual";
};

export function OfferForm({ defaults }: { defaults?: OfferDefaults }) {
  const isEdit = !!defaults?.id;
  const action = isEdit ? updateCampaign.bind(null, defaults!.id!) : createCampaign;

  const [name, setName] = useState(defaults?.name ?? "");
  const [reward, setReward] = useState(defaults?.reward_text ?? "");
  // Kept as a STRING, not a number: with a number state, clearing the box
  // immediately forces a value back into it, so the last digit can never be
  // deleted — you'd be stuck editing around a "1" that won't go away.
  const [stamps, setStamps] = useState(String(defaults?.stamps_required ?? 10));
  const [image, setImage] = useState(defaults?.reward_image_url ?? "");

  // Only the preview is clamped; the field keeps exactly what you typed.
  const stampCount = Math.min(Math.max(parseInt(stamps, 10) || 0, 1), MAX_STAMPS);
  const dots = Array.from({ length: stampCount }, (_, i) => i);

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_320px]">
      {/* form */}
      <form
        action={action}
        className="min-w-0 space-y-4 rounded-2xl border border-line bg-card p-5"
      >
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Offer name
          </label>
          <input
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Coffee stamp card"
            className="w-full rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label htmlFor="reward_text" className="mb-1 block text-sm font-medium">
            Reward description
          </label>
          <input
            id="reward_text"
            name="reward_text"
            required
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder="Free coffee"
            className="w-full rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="stamps_required" className="mb-1 block text-sm font-medium">
              Visits required
            </label>
            <input
              id="stamps_required"
              name="stamps_required"
              type="number"
              inputMode="numeric"
              required
              min={1}
              max={MAX_STAMPS}
              value={stamps}
              onChange={(e) => setStamps(e.target.value)}
              className="w-full rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <p className="mt-1 text-xs text-faint">1–{MAX_STAMPS} stamps</p>
          </div>
          <div>
            <label htmlFor="reward_expiry_days" className="mb-1 block text-sm font-medium">
              Reward expiry (days)
            </label>
            <input
              id="reward_expiry_days"
              name="reward_expiry_days"
              type="number"
              min={1}
              defaultValue={defaults?.reward_expiry_days ?? 30}
              className="w-full rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Reward image <span className="text-faint">(optional)</span>
          </label>
          <ImageUpload
            name="reward_image_url"
            defaultValue={defaults?.reward_image_url ?? ""}
            onChange={setImage}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="approval_mode" className="mb-1 block text-sm font-medium">
              Stamp approval
            </label>
            <select
              id="approval_mode"
              name="approval_mode"
              defaultValue={defaults?.approval_mode ?? "auto"}
              className="w-full rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="auto">Auto-approve</option>
              <option value="manual">Manual approval</option>
            </select>
          </div>
          <div>
            <label htmlFor="stamp_validity_days" className="mb-1 block text-sm font-medium">
              Stamp validity (days)
            </label>
            <input
              id="stamp_validity_days"
              name="stamp_validity_days"
              type="number"
              min={1}
              defaultValue={defaults?.stamp_validity_days ?? undefined}
              placeholder="blank = never"
              className="w-full rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        <SubmitButton className="w-full rounded-lg bg-brand px-4 py-2.5 font-semibold text-white transition hover:bg-brand-ink">
          {isEdit ? "Save changes" : "Create offer"}
        </SubmitButton>
      </form>

      {/* live preview */}
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
          Live preview
        </div>
        <div className="min-w-0 rounded-2xl border border-line bg-card p-5 shadow-sm">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="mx-auto mb-3 h-20 w-20 rounded-xl object-cover"
            />
          ) : (
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-xl bg-accent/10 text-2xl text-accent">
              🎁
            </div>
          )}
          <div className="text-center">
            <div className="text-xs uppercase tracking-wide text-ok">
              Your next treat
            </div>
            <div className="font-bold">{reward || "Your reward"}</div>
            <div className="text-sm text-muted">
              Collect {stampCount} stamps
            </div>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-1.5 [&>*]:min-w-0">
            {dots.map((i) => (
              <div
                key={i}
                className="flex aspect-square items-center justify-center rounded-full border border-dashed border-line-strong text-[10px] text-faint"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
