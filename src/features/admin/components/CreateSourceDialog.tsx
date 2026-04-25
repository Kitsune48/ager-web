"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createSourceAdmin,
  probeRssFeed,
  type CreateSourceInput,
  type RssProbeResult,
} from "@/lib/api/sources";
import { ApiError } from "@/lib/api/errors";

// Mirrors backend `SourceTypeMap`. Type values are uppercase, case-sensitive.
const SOURCE_TYPES = ["RSS", "MANUAL", "API", "AGENCY"] as const;
type SourceType = (typeof SOURCE_TYPES)[number];

// Form validation. The backend's FluentValidation mirrors these rules; we duplicate them
// here so the user gets immediate feedback without a round-trip — the backend remains
// the authoritative validator.
const createSchema = z.object({
  type: z.enum(SOURCE_TYPES),
  name: z.string().trim().min(1).max(150),
  url: z.url().max(2048),
  rssUrl: z.url().max(2048).optional().or(z.literal("")),
  country: z
    .string()
    .regex(/^[A-Za-z]{2}$/)
    .optional()
    .or(z.literal("")),
  lang: z.string().max(10).optional().or(z.literal("")),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string | null | undefined;
  /** Called once after a successful create. Use to invalidate `adminSources` queries. */
  onCreated?: (id: number) => void;
};

type FormState = {
  type: SourceType;
  name: string;
  url: string;
  rssUrl: string;
  country: string;
  lang: string;
};

const EMPTY: FormState = {
  type: "RSS",
  name: "",
  url: "",
  rssUrl: "",
  country: "",
  lang: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

export default function CreateSourceDialog({ open, onOpenChange, accessToken, onCreated }: Props) {
  const t = useTranslations("admin.sources.create");

  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<RssProbeResult | null>(null);

  // Reset on open so a previous attempt's state never leaks into a new session.
  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setFieldErrors({});
      setProbeResult(null);
      setPending(false);
      setProbing(false);
    }
  }, [open]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Editing a field clears its error and any stale probe — the URL might have changed.
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    if (key === "rssUrl") setProbeResult(null);
  }

  async function onProbe() {
    const url = form.rssUrl.trim();
    if (!url) {
      setFieldErrors((p) => ({ ...p, rssUrl: t("errors.rssUrlRequiredForProbe") }));
      return;
    }
    // Sanity: must be a well-formed http(s) URL — same rule the backend enforces.
    if (!/^https?:\/\//i.test(url)) {
      setFieldErrors((p) => ({ ...p, rssUrl: t("errors.rssUrlMustBeHttp") }));
      return;
    }

    setProbing(true);
    setProbeResult(null);
    try {
      const result = await probeRssFeed(url, accessToken ?? undefined);
      setProbeResult(result);
    } catch (err) {
      const apiErr = err as ApiError;
      // Probe endpoint is rate-limited by the backend; surface 429 distinctly.
      const reason = apiErr?.status === 429 ? "rate_limited" : "probe_failed";
      setProbeResult({ valid: false, reason });
    } finally {
      setProbing(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = createSchema.safeParse(form);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string" && path in EMPTY) {
          next[path as keyof FormState] = t("errors.invalidField");
        }
      }
      setFieldErrors(next);
      return;
    }

    const payload: CreateSourceInput = {
      type: form.type,
      name: form.name.trim(),
      url: form.url.trim(),
      rssUrl: form.rssUrl.trim() ? form.rssUrl.trim() : null,
      country: form.country.trim() ? form.country.trim().toUpperCase() : null,
      lang: form.lang.trim() ? form.lang.trim() : null,
    };

    setPending(true);
    try {
      const { id } = await createSourceAdmin(payload, accessToken ?? undefined);
      toast.success(t("toasts.created"));
      onCreated?.(id);
      onOpenChange(false);
    } catch (err) {
      const apiErr = err as ApiError;
      // 409 → duplicate URL. Show inline on the URL field so the admin can fix without
      // re-typing everything else.
      if (apiErr?.status === 409) {
        setFieldErrors((p) => ({ ...p, url: t("errors.duplicateUrl") }));
        return;
      }
      // 400 with a hint — surface the title/detail. The backend's invalid_url path lands here.
      if (apiErr?.status === 400) {
        setFieldErrors((p) => ({ ...p, url: t("errors.invalidUrl") }));
        return;
      }
      toast.error(t("toasts.createFailed"), {
        description: apiErr?.message ?? String(err),
      });
    } finally {
      setPending(false);
    }
  }

  // Block submission until the URL probe has been at least attempted with a positive result
  // — this prevents the most common admin error (configuring an HTML index page as RSS).
  // We allow override via "Save anyway" when probe failed: some publishers serve XML behind
  // auth / odd content-types but the feed is still consumable.
  const [forceOverride, setForceOverride] = useState(false);
  useEffect(() => {
    if (!open) setForceOverride(false);
  }, [open]);

  const probeOk = probeResult?.valid === true;
  const probeBad = probeResult !== null && probeResult.valid === false;
  const hasRssUrl = form.rssUrl.trim().length > 0;
  // If RSS URL is supplied, gate the submit on a positive probe (or explicit override).
  // For non-RSS types or sources without an RSS URL, the gate is skipped.
  const submitGated = hasRssUrl && form.type === "RSS" && !probeOk && !forceOverride;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="src-type">{t("fields.type")}</Label>
            <select
              id="src-type"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={form.type}
              onChange={(e) => update("type", e.target.value as SourceType)}
              disabled={pending}
            >
              {SOURCE_TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="src-name">{t("fields.name")}</Label>
            <Input
              id="src-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              maxLength={150}
              required
              disabled={pending}
            />
            {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="src-url">{t("fields.url")}</Label>
            <Input
              id="src-url"
              type="url"
              value={form.url}
              onChange={(e) => update("url", e.target.value)}
              placeholder="https://www.example.com"
              maxLength={2048}
              required
              disabled={pending}
            />
            {fieldErrors.url && <p className="text-xs text-destructive">{fieldErrors.url}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="src-rss">{t("fields.rssUrl")}</Label>
            <div className="flex gap-2">
              <Input
                id="src-rss"
                type="url"
                value={form.rssUrl}
                onChange={(e) => update("rssUrl", e.target.value)}
                placeholder="https://www.example.com/rss.xml"
                maxLength={2048}
                disabled={pending}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={onProbe}
                disabled={pending || probing || !form.rssUrl.trim()}
              >
                {probing ? t("probe.running") : t("probe.action")}
              </Button>
            </div>
            {fieldErrors.rssUrl && <p className="text-xs text-destructive">{fieldErrors.rssUrl}</p>}
            {probeOk && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {t("probe.ok", { root: probeResult?.rootElement ?? "?" })}
              </p>
            )}
            {probeBad && (
              <div className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                <p>{t("probe.failed", { reason: probeResult?.reason ?? "unknown" })}</p>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={forceOverride}
                    onChange={(e) => setForceOverride(e.target.checked)}
                  />
                  <span>{t("probe.saveAnyway")}</span>
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="src-country">{t("fields.country")}</Label>
              <Input
                id="src-country"
                value={form.country}
                onChange={(e) => update("country", e.target.value.toUpperCase())}
                placeholder="IT"
                maxLength={2}
                disabled={pending}
              />
              {fieldErrors.country && <p className="text-xs text-destructive">{fieldErrors.country}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="src-lang">{t("fields.lang")}</Label>
              <Input
                id="src-lang"
                value={form.lang}
                onChange={(e) => update("lang", e.target.value)}
                placeholder="it"
                maxLength={10}
                disabled={pending}
              />
              {fieldErrors.lang && <p className="text-xs text-destructive">{fieldErrors.lang}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={pending || submitGated}>
              {pending ? t("actions.creating") : t("actions.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
