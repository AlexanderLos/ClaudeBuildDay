import { WaterFinder } from "@/components/WaterFinder";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { residentShellClass } from "./fonts";

export default function Home() {
  return (
    // `.resident-shell` (globals.css) scopes the design fonts and focus ring to this page.
    <div className={residentShellClass}>
      <LocaleProvider>
        <WaterFinder />
      </LocaleProvider>
    </div>
  );
}
