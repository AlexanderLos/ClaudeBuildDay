"use client";

import { useState } from "react";
import { RequestDeliveryModal } from "@/components/RequestDeliveryModal";
import { WaterChat } from "@/components/WaterChat";
import { WaterMap } from "@/components/WaterMap";
import type { Site } from "@/lib/sites";

/** Resident (user) page: map ~70% + chat ~30%. Chat recommendations fly the map to the site. */
export function WaterFinder() {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [requestSite, setRequestSite] = useState<Site | null>(null);
  const [routeSiteId, setRouteSiteId] = useState<string | null>(null);

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <div className="h-1/2 w-full md:h-full md:w-[70%]">
        <WaterMap focusId={focusId} onRequestDelivery={setRequestSite} routeSiteId={routeSiteId} />
      </div>
      <aside className="h-1/2 w-full border-t md:h-full md:w-[30%] md:border-l md:border-t-0">
        <WaterChat onFocus={setFocusId} />
      </aside>
      {requestSite && (
        <RequestDeliveryModal
          site={requestSite}
          onClose={() => setRequestSite(null)}
          onRouteRequested={(site) => {
            setRequestSite(null);
            setRouteSiteId(site.id);
          }}
        />
      )}
    </div>
  );
}
