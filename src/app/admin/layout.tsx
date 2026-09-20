import { Instrument_Sans } from "next/font/google";
import { AdminHeader } from "@/components/shell/AdminHeader";
import { LocaleProvider } from "@/i18n/LocaleProvider";

// Variable font: no `weight`. Exposed as a CSS variable that `.admin-shell` maps to `font-sans`.
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // `.admin-shell` (globals.css) scopes fonts, focus ring and motion rules to /admin only.
    <div
      className={`admin-shell ${instrumentSans.variable} min-h-dvh bg-canvas text-ink antialiased`}
    >
      <LocaleProvider>
        <AdminHeader />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </LocaleProvider>
    </div>
  );
}
