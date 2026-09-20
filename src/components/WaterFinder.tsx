"use client";

import { useState } from "react";
import { WaterChat } from "@/components/WaterChat";
import { WaterMap } from "@/components/WaterMap";

/** Resident (user) page: map ~70% + chat ~30%. Chat recommendations fly the map to the site. */
export function WaterFinder() {
  const [focusId, setFocusId] = useState<string | null>(null);

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <div className="h-1/2 w-full md:h-full md:w-[70%]">
        <WaterMap focusId={focusId} />
      </div>
      <aside className="h-1/2 w-full border-t md:h-full md:w-[30%] md:border-l md:border-t-0">
        <WaterChat onFocus={setFocusId} />
      </aside>
    </div>
  );
}
