import type { Metadata } from "next";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";

export const metadata: Metadata = {
  title: "Admin · Water Neighbor",
  description:
    "Import an official water service notice, review every extracted value, and publish only what you approve.",
};

/** Thin Server Component shell; src/app/admin/layout.tsx provides the header and <main>. */
export default function AdminPage() {
  return <AdminWorkspace />;
}
