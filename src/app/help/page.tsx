import type { Metadata } from "next";
import { HelpPage } from "@/components/HelpPage";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { residentShellClass } from "../fonts";

export const metadata: Metadata = {
  title: "How to help · Water Neighbor",
  description: "Organizations helping Puerto Rico communities get water during the 2026 shortage.",
};

export default function Help() {
  return (
    <div className={`${residentShellClass} min-h-dvh`}>
      <LocaleProvider>
        <HelpPage />
      </LocaleProvider>
    </div>
  );
}
