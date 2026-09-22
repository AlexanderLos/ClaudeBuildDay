import type { Metadata } from "next";
import { VolunteerPage } from "@/components/VolunteerPage";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { residentShellClass } from "../fonts";

export const metadata: Metadata = {
  title: "Volunteer · Water Neighbor",
  description: "Sign up to help neighbors in Puerto Rico get water during the next interruption.",
};

export default function Volunteer() {
  return (
    <div className={`${residentShellClass} min-h-dvh`}>
      <LocaleProvider>
        <VolunteerPage />
      </LocaleProvider>
    </div>
  );
}
