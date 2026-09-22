import { redirect } from "next/navigation";

/** The coordinator workflow lives at /admin now; keep old links working. */
export default function CoordinatePage() {
  redirect("/admin");
}
