import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import itMessages from "@/messages/it.json";
import enMessages from "@/messages/en.json";

// Mock next-intl with the same shape as the rest of the suite, plus minimal `{var}`
// interpolation so messages like "Feed valid (root: {root})" get the substitution
// the real next-intl runtime provides.
const localeHolder = { current: "it" as "it" | "en" };

vi.mock("next-intl", () => ({
  useTranslations: (namespace?: string) =>
    (key: string, values?: Record<string, string | number>) => {
      const bundle = (localeHolder.current === "it" ? itMessages : enMessages) as Record<string, unknown>;
      const path = namespace ? `${namespace}.${key}` : key;
      const value = path
        .split(".")
        .reduce<unknown>((acc, segment) => (acc as Record<string, unknown> | null)?.[segment], bundle);
      if (typeof value !== "string") throw new Error(`missing translation key: ${path}`);
      if (!values) return value;
      return value.replace(/\{(\w+)\}/g, (_m, name: string) =>
        Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : `{${name}}`,
      );
    },
}));

// Sonner is non-essential for our assertions; stub it to silent no-ops so tests don't
// depend on its DOM output.
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

// API client mock — we exercise the dialog's branching independently of the network layer.
const createMock = vi.fn();
const probeMock = vi.fn();
vi.mock("@/lib/api/sources", () => ({
  createSourceAdmin: (...args: unknown[]) => createMock(...args),
  probeRssFeed: (...args: unknown[]) => probeMock(...args),
}));

// Dynamic import AFTER mocks so the module under test resolves the mocked deps.
let CreateSourceDialog: typeof import("./CreateSourceDialog").default;

beforeEach(async () => {
  toastSuccess.mockReset();
  toastError.mockReset();
  createMock.mockReset();
  probeMock.mockReset();
  ({ default: CreateSourceDialog } = await import("./CreateSourceDialog"));
});

function renderDialog(overrides: Partial<React.ComponentProps<typeof CreateSourceDialog>> = {}) {
  const onOpenChange = vi.fn();
  const onCreated = vi.fn();
  render(
    <CreateSourceDialog
      open
      onOpenChange={onOpenChange}
      accessToken="test-token"
      onCreated={onCreated}
      {...overrides}
    />,
  );
  return { onOpenChange, onCreated };
}

describe("CreateSourceDialog", () => {
  it("renders core fields when opened", () => {
    localeHolder.current = "it";
    renderDialog();
    expect(screen.getByRole("heading", { name: /Aggiungi una nuova fonte/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("URL homepage")).toBeInTheDocument();
    expect(screen.getByLabelText("URL feed RSS")).toBeInTheDocument();
  });

  it("disables submit when an RSS URL is supplied but the probe hasn't passed", async () => {
    localeHolder.current = "it";
    renderDialog();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nome"), "Test");
    await user.type(screen.getByLabelText("URL homepage"), "https://test.example");
    await user.type(screen.getByLabelText("URL feed RSS"), "https://test.example/feed.xml");

    const submit = screen.getByRole("button", { name: "Crea fonte" });
    expect(submit).toBeDisabled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("enables submit after a successful probe and calls createSourceAdmin", async () => {
    localeHolder.current = "it";
    probeMock.mockResolvedValue({ valid: true, statusCode: 200, rootElement: "rss" });
    createMock.mockResolvedValue({ id: 42 });

    const { onOpenChange, onCreated } = renderDialog();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nome"), "Test");
    await user.type(screen.getByLabelText("URL homepage"), "https://test.example");
    await user.type(screen.getByLabelText("URL feed RSS"), "https://test.example/feed.xml");

    await user.click(screen.getByRole("button", { name: /Verifica feed/i }));
    await waitFor(() => expect(probeMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Feed valido \(root: rss\)/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Crea fonte" }));

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RSS",
        name: "Test",
        url: "https://test.example",
        rssUrl: "https://test.example/feed.xml",
      }),
      "test-token",
    );
    expect(onCreated).toHaveBeenCalledWith(42);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toastSuccess).toHaveBeenCalled();
  });

  it("shows the probe failure reason and offers a 'save anyway' override", async () => {
    localeHolder.current = "it";
    probeMock.mockResolvedValue({ valid: false, reason: "not_a_feed", rootElement: "html" });

    renderDialog();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("URL feed RSS"), "https://test.example/index.html");
    await user.click(screen.getByRole("button", { name: /Verifica feed/i }));
    await waitFor(() => expect(probeMock).toHaveBeenCalledTimes(1));

    expect(await screen.findByText(/Feed non valido: not_a_feed/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Salva comunque/i })).toBeInTheDocument();
  });

  it("renders an inline duplicate-URL error when backend returns 409", async () => {
    localeHolder.current = "it";
    // No RSS URL supplied → submit isn't probe-gated.
    const apiError = Object.assign(new Error("Conflict"), { status: 409, code: "duplicate_source" });
    createMock.mockRejectedValue(apiError);

    const { onOpenChange, onCreated } = renderDialog();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nome"), "Test");
    await user.type(screen.getByLabelText("URL homepage"), "https://duped.example");
    await user.click(screen.getByRole("button", { name: "Crea fonte" }));

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Una fonte con questo URL esiste già/i)).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled(); // dialog stays open so the user can fix
  });

  it("falls back to the toast for unexpected errors (e.g. 500)", async () => {
    localeHolder.current = "it";
    const apiError = Object.assign(new Error("boom"), { status: 500 });
    createMock.mockRejectedValue(apiError);

    renderDialog();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nome"), "Test");
    await user.type(screen.getByLabelText("URL homepage"), "https://err.example");
    await user.click(screen.getByRole("button", { name: "Crea fonte" }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
