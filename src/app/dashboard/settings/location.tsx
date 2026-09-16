"use client";

import { useState } from "react";
import { updateLocationHours } from "./actions";

type Defaults = {
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  geofence_radius?: number | null;
  open_daily?: boolean | null;
  open_from?: string | null;
  close_at?: string | null;
};

const input =
  "w-full rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-accent focus:ring-1 focus:ring-accent";

export function LocationForm({ defaults }: { defaults: Defaults }) {
  const [lat, setLat] = useState(defaults.lat != null ? String(defaults.lat) : "");
  const [lng, setLng] = useState(defaults.lng != null ? String(defaults.lng) : "");
  const [status, setStatus] = useState<string | null>(null);

  function useCurrent() {
    if (!("geolocation" in navigator)) {
      setStatus("Geolocation isn't supported on this device.");
      return;
    }
    setStatus("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLat(p.coords.latitude.toFixed(6));
        setLng(p.coords.longitude.toFixed(6));
        setStatus("Location captured ✓");
      },
      () => setStatus("Couldn't get location — allow permission and try again."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <form action={updateLocationHours} className="space-y-4">
      <div>
        <label htmlFor="address" className="mb-1 block text-sm font-medium">
          Address
        </label>
        <input id="address" name="address" defaultValue={defaults.address ?? ""} className={input} />
      </div>

      <div>
        <div className="mb-1 text-sm font-medium">Opening hours</div>
        <label className="flex items-center gap-2 text-sm text-body">
          <input
            type="checkbox"
            name="open_daily"
            defaultChecked={defaults.open_daily ?? true}
            className="h-4 w-4 accent-brand"
          />
          Open daily (same hours every day)
        </label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="open_from" className="mb-1 block text-xs text-muted">
              Open from
            </label>
            <input id="open_from" name="open_from" type="time" defaultValue={defaults.open_from ?? "09:00"} className={input} />
          </div>
          <div>
            <label htmlFor="close_at" className="mb-1 block text-xs text-muted">
              Close at
            </label>
            <input id="close_at" name="close_at" type="time" defaultValue={defaults.close_at ?? "22:00"} className={input} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line p-3">
        <div className="text-sm font-medium">GPS location (for scan verification)</div>
        <p className="mt-0.5 text-xs text-muted">
          Stand at your store and capture the coordinates. Used for geofenced scans.
        </p>
        <button
          type="button"
          onClick={useCurrent}
          className="mt-2 rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/5"
        >
          📍 Use current location
        </button>
        {status && <p className="mt-2 text-xs text-muted">{status}</p>}
        {lat && lng && (
          <p className="mt-1 text-xs font-medium text-ok">
            GPS set: {lat}, {lng}
          </p>
        )}
        <input type="hidden" name="lat" value={lat} />
        <input type="hidden" name="lng" value={lng} />
        <div className="mt-2">
          <label htmlFor="geofence_radius" className="mb-1 block text-xs text-muted">
            Geofence radius (meters)
          </label>
          <input
            id="geofence_radius"
            name="geofence_radius"
            type="number"
            min={20}
            defaultValue={defaults.geofence_radius ?? 200}
            className={input}
          />
        </div>
      </div>

      <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-ink">
        Save location &amp; hours
      </button>
    </form>
  );
}
