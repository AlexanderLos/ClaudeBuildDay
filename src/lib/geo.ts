/** Location helpers shared by the resident map, the delivery form and the delivery API. Nothing here stores or logs a coordinate. */
export type LatLng = { lat: number; lng: number };

export const inPuertoRico = ({ lat, lng }: LatLng): boolean =>
  lat >= 17.8 && lat <= 18.6 && lng >= -67.4 && lng <= -65.1;

/** 3 decimals ≈ ±100 m: enough for a volunteer driver to find the sector, not the house. */
export const roundApprox = ({ lat, lng }: LatLng): LatLng => ({
  lat: Math.round(lat * 1000) / 1000,
  lng: Math.round(lng * 1000) / 1000,
});

/** Opt-in device location. Resolves null when denied, unavailable, timed out, or on an insecure context. */
export function getDeviceLocation(): Promise<LatLng | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, enableHighAccuracy: false },
    );
  });
}
