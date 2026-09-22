import { DM_Serif_Display, Instrument_Sans } from "next/font/google";

// Variable font: no `weight`. `.resident-shell` (globals.css) maps these variables to the fonts.
export const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif-display",
});

/** Classes for the wrapper of every resident-facing page. */
export const residentShellClass = `resident-shell ${instrumentSans.variable} ${dmSerifDisplay.variable} bg-canvas text-ink antialiased`;
