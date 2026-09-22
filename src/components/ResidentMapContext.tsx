"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { getDeviceLocation, inPuertoRico, type LatLng } from "@/lib/geo";

type ResidentMap = {
  /** Real device location, opt-in only. In memory: never persisted, never logged. Null until the resident asks. */
  userLocation: LatLng | null;
  locating: boolean;
  locationFailed: boolean;
  /** Asks the browser for the device location. Null when denied, unavailable or outside Puerto Rico. */
  requestUserLocation: () => Promise<LatLng | null>;
  dismissLocationFailed: () => void;
};

const locate = async (): Promise<LatLng | null> => {
  const found = await getDeviceLocation();
  return found && inPuertoRico(found) ? found : null;
};

// No provider (tests, the card rendered elsewhere): location still works, nothing is shared.
const FALLBACK: ResidentMap = {
  userLocation: null,
  locating: false,
  locationFailed: false,
  requestUserLocation: locate,
  dismissLocationFailed: () => {},
};

const Context = createContext<ResidentMap>(FALLBACK);

export const useResidentMap = () => useContext(Context);

export function ResidentMapProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationFailed, setLocationFailed] = useState(false);

  const value = useMemo<ResidentMap>(
    () => ({
      userLocation,
      locating,
      locationFailed,
      requestUserLocation: async () => {
        if (userLocation) return userLocation;
        setLocating(true);
        const found = await locate();
        setLocating(false);
        setLocationFailed(!found);
        if (found) setUserLocation(found);
        return found;
      },
      dismissLocationFailed: () => setLocationFailed(false),
    }),
    [userLocation, locating, locationFailed],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
