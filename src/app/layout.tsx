import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Water Neighbor",
  description: "Clear, local water information for neighbors, from official AAA notices.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
