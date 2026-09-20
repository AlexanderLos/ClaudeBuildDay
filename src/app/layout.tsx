import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Water Neighbor",
  description: "Clear, local, verified water information for neighbors.",
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
