import { DM_Serif_Display, Instrument_Sans } from "next/font/google";
import { AppHeader } from "@/components/shell/AppHeader";
import { LocaleProvider } from "@/i18n/LocaleProvider";

// Variable font: no `weight`. Exposed as a CSS variable that `.admin-shell` maps to `font-sans`.
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif-display",
});

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // `.admin-shell` (globals.css) scopes fonts, focus ring and motion rules to /admin only.
    <div
      className={`admin-shell ${instrumentSans.variable} ${dmSerifDisplay.variable} min-h-dvh bg-canvas text-ink antialiased`}
    >
      <LocaleProvider>
        <AppHeader />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </LocaleProvider>
    </div>
  );
}
