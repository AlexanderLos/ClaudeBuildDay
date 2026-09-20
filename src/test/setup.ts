import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
  // Locale and published notices live in localStorage; every test starts from a first visit.
  if (typeof window !== "undefined") window.localStorage.clear();
});
