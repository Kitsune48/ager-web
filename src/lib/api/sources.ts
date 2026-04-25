import { API_BASE } from "@/lib/api/client";
import { requestJson, requestVoid } from "@/lib/api/request";
import type { Source, SourceAdmin, SourceAdminUpdate } from "@/lib/api/types";

function makeUrl(path: string): string {
  const isBrowser = typeof window !== "undefined";
  return isBrowser ? path : `${API_BASE}${path}`;
}

export async function listSourcesPublic(): Promise<Source[]> {
  return requestJson<Source[]>(makeUrl("/api/sources"), { method: "GET", cache: "no-store" });
}

export type AdminSourcesFilter = {
  expiringIn?: number;
  tdmOptout?: boolean;
  negotiation?: "in_progress";
};

export async function listSourcesAdmin(
  filter: AdminSourcesFilter = {},
  accessToken?: string,
): Promise<SourceAdmin[]> {
  const url = new URL(
    makeUrl("/api/admin/sources"),
    typeof window !== "undefined" ? window.location.origin : "http://localhost",
  );
  if (filter.expiringIn) url.searchParams.set("expiringIn", String(filter.expiringIn));
  if (filter.tdmOptout) url.searchParams.set("tdmOptout", "true");
  if (filter.negotiation) url.searchParams.set("negotiation", filter.negotiation);
  return requestJson<SourceAdmin[]>(url.toString(), {
    method: "GET",
    cache: "no-store",
    accessToken,
    credentials: "include",
  });
}

export async function getSourceAdmin(id: number, accessToken?: string): Promise<SourceAdmin> {
  return requestJson<SourceAdmin>(makeUrl(`/api/admin/sources/${id}`), {
    method: "GET",
    cache: "no-store",
    accessToken,
    credentials: "include",
  });
}

export async function patchSourceAdmin(
  id: number,
  body: SourceAdminUpdate,
  accessToken?: string,
): Promise<void> {
  await requestVoid(makeUrl(`/api/admin/sources/${id}`), {
    method: "PATCH",
    accessToken,
    credentials: "include",
    body,
  });
}

export async function refreshTosSnapshot(
  id: number,
  accessToken?: string,
): Promise<{ previousHash: string | null; currentHash: string; changed: boolean }> {
  return requestJson<{ previousHash: string | null; currentHash: string; changed: boolean }>(
    makeUrl(`/api/admin/sources/${id}/refresh-tos`),
    {
      method: "POST",
      accessToken,
      credentials: "include",
    },
  );
}

// ----- "Add source" admin flow ---------------------------------------------------------

// Mirrors Ager.Application.DTOs.Sources.SourceAdminCreate. `type` is the same string the
// backend expects via SourceTypeMap (RSS|MANUAL|API|AGENCY); not localised.
export type CreateSourceInput = {
  type: "RSS" | "MANUAL" | "API" | "AGENCY";
  name: string;
  url: string;
  rssUrl?: string | null;
  country?: string | null;
  lang?: string | null;
};

// Mirrors Ager.Application.DTOs.Sources.RssProbeResponse. `valid` is true only when
// the URL responded 200 with an XML payload whose root looks like an RSS/Atom feed.
// `reason` is a machine-readable hint (`http_404`, `not_xml`, `not_a_feed`, `timeout`,
// `url_not_allowed:…`, `http_error:…`, etc.) that the form maps to a localised message.
export type RssProbeResult = {
  valid: boolean;
  statusCode?: number | null;
  contentType?: string | null;
  rootElement?: string | null;
  finalUrl?: string | null;
  reason?: string | null;
};

export async function createSourceAdmin(
  body: CreateSourceInput,
  accessToken?: string,
): Promise<{ id: number }> {
  return requestJson<{ id: number }>(makeUrl("/api/admin/sources"), {
    method: "POST",
    accessToken,
    credentials: "include",
    body,
  });
}

export async function probeRssFeed(
  rssUrl: string,
  accessToken?: string,
): Promise<RssProbeResult> {
  return requestJson<RssProbeResult>(makeUrl("/api/admin/sources/probe-rss"), {
    method: "POST",
    accessToken,
    credentials: "include",
    body: { rssUrl },
  });
}
