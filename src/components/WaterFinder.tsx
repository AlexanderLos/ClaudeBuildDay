"use client";

import { useState } from "react";
import { ResidentMapProvider } from "@/components/ResidentMapContext";
import { ResidentHeader } from "@/components/ResidentHeader";
import { StatusBanner } from "@/components/StatusBanner";
import { SupportLocationsPanel } from "@/components/SupportLocationsPanel";
import { WaterChat } from "@/components/WaterChat";
import { WaterMap, type MapFocus } from "@/components/WaterMap";
import { REPLAY_DEFAULT } from "@/lib/chat-contract";

/**
 * Resident page: top bar, status banner, then map + fixed-width chat column. A chat answer flies the
 * map to the resident's municipality. `ResidentMapProvider` shares the opt-in device location with the
 * delivery form deep in the chat column.
 */
export function WaterFinder() {
  const [replay, setReplay] = useState(false);
  const [replayDate, setReplayDate] = useState<string>(REPLAY_DEFAULT);
  const [focus, setFocus] = useState<MapFocus | null>(null);

  // A new object every time, so focusing the same municipality again still re-flies the map.
  const focusMunicipality = (name: string) => setFocus((prev) => ({ name, n: (prev?.n ?? 0) + 1 }));

  return (
    <ResidentMapProvider>
      <div className="flex h-dvh flex-col bg-canvas">
        <ResidentHeader
          replay={replay}
          replayDate={replayDate}
          onReplayChangeAction={setReplay}
          onReplayDateChangeAction={setReplayDate}
        />
        <StatusBanner replay={replay} replayDate={replayDate} onExitReplayAction={() => setReplay(false)} />
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="relative h-[32dvh] min-h-0 shrink-0 md:h-auto md:flex-1 md:shrink">
            <WaterMap focus={focus} />
            <SupportLocationsPanel />
          </div>
          <aside className="min-h-0 flex-1 border-t border-line bg-canvas md:w-[400px] md:flex-none md:border-l md:border-t-0 lg:w-[440px]">
            <WaterChat simulateDate={replay} replayDate={replayDate} onFocusAction={focusMunicipality} />
          </aside>
        </div>
      </div>
    </ResidentMapProvider>
  );
}
