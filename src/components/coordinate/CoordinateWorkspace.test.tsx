import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider, useLocale } from "@/i18n/LocaleProvider";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";
import { PUBLISHED_STORAGE_KEY, publishedStoreSchema } from "@/lib/contracts";
import { SAMPLE_NOTICE } from "@/lib/sample-notice";
import { CoordinateWorkspace } from "./CoordinateWorkspace";

const fetchMock = vi.fn();

/** The shell's LanguageToggle belongs to another worker, so tests flip the locale themselves. */
function LocaleSwitch() {
  const { locale, setLocale } = useLocale();
  return (
    <button type="button" onClick={() => setLocale(locale === "en" ? "es" : "en")}>
      switch-language
    </button>
  );
}

function renderWorkspace() {
  render(
    <LocaleProvider>
      <LocaleSwitch />
      <CoordinateWorkspace />
    </LocaleProvider>,
  );
}

function pdfFile(name = "aviso.pdf", size = 2048) {
  const file = new File(["%PDF-1.4"], name, { type: "application/pdf" });
  // jsdom derives size from the parts, so oversize files are faked here.
  Object.defineProperty(file, "size", { value: size });
  return file;
}

/** requestExtraction only reads `.json()`. */
const respond = (payload: unknown) => ({ json: async () => payload }) as Response;
const okPayload = { ok: true, notice: SAMPLE_NOTICE };

const fileInput = () => screen.getByLabelText(en.coordinate.upload.inputLabel);
const switchLanguage = (user: UserEvent) =>
  user.click(screen.getByRole("button", { name: "switch-language" }));

async function goToReview(user: UserEvent, payload: unknown = okPayload) {
  fetchMock.mockResolvedValue(respond(payload));
  await user.upload(fileInput(), pdfFile());
  await user.click(screen.getByRole("button", { name: en.coordinate.upload.extract }));
  return screen.findByRole("heading", { name: en.coordinate.review.heading });
}

/** The <li> wrapping the review card whose named input holds `value`. */
const cardFor = (value: string) => screen.getByDisplayValue(value).closest("li") as HTMLElement;

const publishButton = () =>
  screen.getByRole("button", { name: en.coordinate.publish.button });

function readStore() {
  const raw = window.localStorage.getItem(PUBLISHED_STORAGE_KEY);
  return publishedStoreSchema.parse(JSON.parse(raw as string));
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("upload", () => {
  it("selects a PDF through the file input", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.upload(fileInput(), pdfFile());

    expect(screen.getByText("aviso.pdf")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: en.coordinate.upload.extract }),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("selects the first PDF of a drop", () => {
    renderWorkspace();

    fireEvent.drop(fileInput().parentElement as HTMLElement, {
      dataTransfer: { files: [pdfFile("primero.pdf"), pdfFile("segundo.pdf")] },
    });

    expect(screen.getByText("primero.pdf")).toBeInTheDocument();
    expect(screen.queryByText("segundo.pdf")).toBeNull();
  });

  it("rejects a non-PDF on the client without calling the API", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderWorkspace();

    await user.upload(fileInput(), new File(["x"], "aviso.txt", { type: "text/plain" }));

    expect(screen.getByRole("alert")).toHaveTextContent(en.errors.unsupported_type);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a PDF over 10 MB on the client without calling the API", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.upload(fileInput(), pdfFile("grande.pdf", 11 * 1024 * 1024));

    expect(screen.getByRole("alert")).toHaveTextContent(en.errors.file_too_large);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a live status while extracting and cancelling returns to the selected file", async () => {
    const user = userEvent.setup();
    // Never settles: cancelling must not wait for the network.
    fetchMock.mockReturnValue(new Promise(() => {}));
    renderWorkspace();
    await user.upload(fileInput(), pdfFile());

    await user.click(screen.getByRole("button", { name: en.coordinate.upload.extract }));
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(en.coordinate.extracting.title);
    expect(status).toHaveAttribute("aria-live", "polite");

    await user.click(screen.getByRole("button", { name: en.coordinate.extracting.cancel }));

    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("aviso.pdf")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: en.coordinate.upload.extract }),
    ).toBeInTheDocument();
  });
});

describe("review", () => {
  it("renders statuses, evidence, confidence, zones and the unmappable note", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await goToReview(user);

    // 10 reviewable items in the sample: 6 matched, 4 needing review.
    expect(screen.getAllByText(en.status.matched)).toHaveLength(6);
    expect(screen.getAllByText(en.status.needs_review)).toHaveLength(4);
    expect(screen.getByText("Matched to notice: 6")).toBeInTheDocument();
    expect(screen.getByText("Needs review: 4")).toBeInTheDocument();

    expect(screen.getAllByText("Page 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText(en.coordinate.review.evidenceNoPage).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Texto de muestra (datos de demostración).")[0].tagName,
    ).toBe("BLOCKQUOTE");
    expect(screen.getAllByText(`${en.coordinate.review.confidenceLabel}: High`).length).toBe(6);

    expect(
      screen.getAllByLabelText(en.coordinate.review.fields.zone).map((z) => (z as HTMLInputElement).value),
    ).toEqual(["Zona 1", "Zona 2", "Zona 1"]);
    expect(screen.getByText(en.coordinate.review.sourceFile, { exact: false })).toHaveTextContent(
      "aviso.pdf",
    );

    expect(screen.getByText(en.coordinate.legend.matched)).toBeInTheDocument();
    expect(screen.getByText(en.coordinate.publish.noneApproved)).toBeInTheDocument();

    const unmappable = cardFor("Punto de muestra sin coordenadas");
    expect(within(unmappable).getByText(en.coordinate.mapping.unmappable)).toBeInTheDocument();
    expect(within(unmappable).queryByRole("button", { name: en.coordinate.mapping.approve })).toBeNull();
    expect(within(unmappable).queryByRole("button", { name: en.coordinate.mapping.undo })).toBeNull();
  });

  it("says so when the notice lists nothing for a section", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await goToReview(user, {
      ok: true,
      notice: {
        ...SAMPLE_NOTICE,
        affectedAreas: [],
        interruptionWindows: [],
        resources: [],
        residentInstructions: [],
      },
    });

    for (const text of Object.values(en.coordinate.review.empty)) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(screen.getByText("Matched to notice: 2")).toBeInTheDocument();
    expect(screen.getByText("Needs review: 1")).toBeInTheDocument();
  });

  it("marks an edited field and publishes the edited value", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await goToReview(user);

    const title = screen.getByLabelText(en.coordinate.review.sections.title);
    await user.clear(title);
    await user.type(title, "Aviso corregido por Coordinación");

    expect(title).toHaveValue("Aviso corregido por Coordinación");
    expect(screen.getByText(en.coordinate.review.edited)).toBeInTheDocument();

    await user.click(publishButton());

    expect(readStore().notices[0].notice.title).toMatchObject({
      value: "Aviso corregido por Coordinación",
      edited: true,
    });
  });

  it("maps an empty nullable input back to null", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await goToReview(user);

    const date = screen.getByLabelText(en.coordinate.review.sections.publicationDate);
    expect(date).toHaveAttribute("placeholder", en.coordinate.review.notStated);
    await user.type(date, "5 de marzo");
    await user.clear(date);
    await user.click(publishButton());

    expect(readStore().notices[0].notice.publicationDate.value).toBeNull();
  });

  it("keeps communities as a string array typed with commas", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await goToReview(user);

    const communities = screen.getAllByLabelText(en.coordinate.review.fields.communities)[0];
    await user.clear(communities);
    await user.type(communities, "Barrio Obrero, Villa Palmeras");

    // The separator the coordinator typed is still there: nothing is re-joined back into the box.
    expect(communities).toHaveValue("Barrio Obrero, Villa Palmeras");

    await user.click(publishButton());

    expect(readStore().notices[0].notice.affectedAreas[0].communities).toEqual([
      "Barrio Obrero",
      "Villa Palmeras",
    ]);
  });
});

describe("map approval", () => {
  it("toggles aria-pressed on the curated suggestion", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await goToReview(user);

    const card = cardFor("Pozo Escorial");
    expect(within(card).getByText(/Pozo Escorial/)).toBeInTheDocument();
    const approve = within(card).getByRole("button", { name: en.coordinate.mapping.approve });
    expect(approve).toHaveAttribute("aria-pressed", "false");

    await user.click(approve);

    const undo = within(card).getByRole("button", { name: en.coordinate.mapping.undo });
    expect(undo).toHaveAttribute("aria-pressed", "true");
    expect(within(card).getByText(en.coordinate.mapping.approved)).toBeInTheDocument();
  });

  it("drops a stale approval when the resource name is edited", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await goToReview(user);

    await user.click(
      within(cardFor("Pozo Escorial")).getByRole("button", {
        name: en.coordinate.mapping.approve,
      }),
    );
    await user.type(screen.getByDisplayValue("Pozo Escorial"), " norte");

    const card = cardFor("Pozo Escorial norte");
    expect(
      within(card).getByRole("button", { name: en.coordinate.mapping.approve }),
    ).toHaveAttribute("aria-pressed", "false");

    await user.click(publishButton());
    expect(readStore().notices[0].mapResources).toEqual([]);
  });
});

describe("publishing", () => {
  it("stores only approved mapped resources while keeping every reviewed resource", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await goToReview(user);
    await user.click(
      within(cardFor("Pozo Escorial")).getByRole("button", {
        name: en.coordinate.mapping.approve,
      }),
    );

    await user.click(publishButton());

    const published = readStore().notices[0];
    expect(published.notice.resources).toHaveLength(3);
    expect(published.mapResources).toHaveLength(1);
    expect(published.mapResources[0]).toMatchObject({
      resourceId: "resource-0",
      name: "Pozo Escorial",
      coordinateSource: "curated_demo",
      candidateId: "pozo-escorial",
      candidateName: "Pozo Escorial",
      reviewStatus: "matched",
    });
    expect(published.mapResources[0].evidence.page).toBe(3);
    expect(published.origin).toBe("ai_extraction");
    expect(published.sourceFileName).toBe("aviso.pdf");
  });

  it("reports honest counts and never claims water is available", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await goToReview(user);
    await user.click(
      within(cardFor("Pozo Escorial")).getByRole("button", {
        name: en.coordinate.mapping.approve,
      }),
    );
    await user.click(publishButton());

    await screen.findByRole("heading", { name: en.coordinate.published.heading });
    expect(screen.getByText("Locations published to the map: 1")).toBeInTheDocument();
    expect(
      screen.getByText("Locations kept for confirmation, not on the map: 2"),
    ).toBeInTheDocument();
    expect(screen.getByText("Sections still marked “Needs review”: 4")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Listed in the official notice from Organización de muestra (demostración)",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(en.coordinate.published.disclaimer)).toBeInTheDocument();
    expect(screen.getByText(en.coordinate.published.localOnly)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: en.coordinate.published.backHome })).toHaveAttribute(
      "href",
      "/",
    );
    expect(document.body.textContent).not.toMatch(/verified|water available|open now/i);

    await user.click(
      screen.getByRole("button", { name: en.coordinate.published.importAnother }),
    );
    expect(
      screen.getByRole("button", { name: en.coordinate.upload.chooseFile }),
    ).toBeInTheDocument();
  });

  it("stays in review and explains when the browser refuses to store the notice", async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    renderWorkspace();
    await goToReview(user);

    await user.click(publishButton());

    expect(
      screen.getByRole("heading", { name: en.coordinate.review.heading }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(en.errors.storage_failed);
  });
});

describe("errors and language", () => {
  it("translates an API error code and re-translates it without another request", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(respond({ ok: false, error: { code: "not_a_notice" } }));
    renderWorkspace();
    await user.upload(fileInput(), pdfFile());
    await user.click(screen.getByRole("button", { name: en.coordinate.upload.extract }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(en.coordinate.errorPanel.title);
    expect(alert).toHaveTextContent(en.errors.not_a_notice);

    await switchLanguage(user);

    expect(screen.getByRole("alert")).toHaveTextContent(es.errors.not_a_notice);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("re-runs extraction with the same file from the error panel", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(respond({ ok: false, error: { code: "timeout" } }));
    renderWorkspace();
    await user.upload(fileInput(), pdfFile());
    await user.click(screen.getByRole("button", { name: en.coordinate.upload.extract }));
    await screen.findByRole("alert");

    fetchMock.mockResolvedValue(respond(okPayload));
    await user.click(screen.getByRole("button", { name: en.coordinate.errorPanel.retry }));

    await screen.findByRole("heading", { name: en.coordinate.review.heading });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports a network failure", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    renderWorkspace();
    await user.upload(fileInput(), pdfFile());
    await user.click(screen.getByRole("button", { name: en.coordinate.upload.extract }));

    expect(await screen.findByRole("alert")).toHaveTextContent(en.errors.network);
  });

  it("keeps the selected file and review edits across a language change", async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await user.upload(fileInput(), pdfFile());

    await switchLanguage(user);
    expect(screen.getByText("aviso.pdf")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: es.coordinate.upload.extract }),
    ).toBeInTheDocument();

    await switchLanguage(user);
    fetchMock.mockResolvedValue(respond(okPayload));
    await user.click(screen.getByRole("button", { name: en.coordinate.upload.extract }));
    await screen.findByRole("heading", { name: en.coordinate.review.heading });

    const title = screen.getByLabelText(en.coordinate.review.sections.title);
    await user.clear(title);
    await user.type(title, "Aviso corregido");

    await switchLanguage(user);

    expect(screen.getByLabelText(es.coordinate.review.sections.title)).toHaveValue(
      "Aviso corregido",
    );
    expect(screen.getAllByText(es.status.matched)).toHaveLength(6);
    expect(screen.getByText(es.coordinate.review.edited)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("demo fallback", () => {
  it("is absent unless the flag is exactly \"true\"", () => {
    renderWorkspace();
    expect(screen.queryByRole("button", { name: en.coordinate.demo.loadSample })).toBeNull();
  });

  it("loads sample data behind a Demo data label when the flag is on", async () => {
    const user = userEvent.setup();
    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEMO_FALLBACK", "true");
    renderWorkspace();

    await user.click(screen.getByRole("button", { name: en.coordinate.demo.loadSample }));

    expect(
      screen.getByRole("heading", { name: en.coordinate.review.heading }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.common.demoDataBadge)).toBeInTheDocument();
    expect(screen.getByText(en.coordinate.demo.resultNote)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(
      within(cardFor("Pozo Escorial")).getByRole("button", {
        name: en.coordinate.mapping.approve,
      }),
    );
    await user.click(publishButton());

    await screen.findByRole("heading", { name: en.coordinate.published.heading });
    expect(screen.getByText(en.common.demoDataBadge)).toBeInTheDocument();
    expect(screen.getByText(en.coordinate.published.listedInDemo)).toBeInTheDocument();
    const published = readStore().notices[0];
    expect(published.origin).toBe("demo_sample");
    expect(published.sourceFileName).toBeNull();
  });

  it("never substitutes sample data after an extraction failure", async () => {
    const user = userEvent.setup();
    vi.stubEnv("NEXT_PUBLIC_ENABLE_DEMO_FALLBACK", "true");
    fetchMock.mockResolvedValue(respond({ ok: false, error: { code: "malformed_output" } }));
    renderWorkspace();
    await user.upload(fileInput(), pdfFile());
    await user.click(screen.getByRole("button", { name: en.coordinate.upload.extract }));

    expect(await screen.findByRole("alert")).toHaveTextContent(en.errors.malformed_output);
    expect(screen.queryByRole("heading", { name: en.coordinate.review.heading })).toBeNull();
    expect(screen.queryByText(en.common.demoDataBadge)).toBeNull();
  });
});
