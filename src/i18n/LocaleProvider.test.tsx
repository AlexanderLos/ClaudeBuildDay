import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LOCALE_STORAGE_KEY } from "@/lib/contracts";
import { LocaleProvider, useLocale } from "./LocaleProvider";

function Probe() {
  const { locale, setLocale, t } = useLocale();
  return (
    <button onClick={() => setLocale(locale === "en" ? "es" : "en")}>{t.nav.coordinate}</button>
  );
}

describe("LocaleProvider", () => {
  it("defaults to English on a first visit", () => {
    render(<LocaleProvider><Probe /></LocaleProvider>);
    expect(screen.getByRole("button")).toHaveTextContent("Coordinate");
    expect(document.documentElement.lang).toBe("en");
  });

  it("switches to Spanish and back, persisting the choice and the document language", async () => {
    const user = userEvent.setup();
    render(<LocaleProvider><Probe /></LocaleProvider>);

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("Coordinar");
    expect(document.documentElement.lang).toBe("es");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("es");

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("Coordinate");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
  });

  it("restores a stored preference on the next visit", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "es");
    render(<LocaleProvider><Probe /></LocaleProvider>);
    expect(screen.getByRole("button")).toHaveTextContent("Coordinar");
  });

  it("falls back to English when the stored value is not a locale", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "fr");
    render(<LocaleProvider><Probe /></LocaleProvider>);
    expect(screen.getByRole("button")).toHaveTextContent("Coordinate");
  });
});
