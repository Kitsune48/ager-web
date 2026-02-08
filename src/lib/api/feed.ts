import { apiFetch } from "./client";
import type { FeedPage, Cursor } from "./types";

export async function fetchFeedPage(
  params: { cursor?: Cursor; limit?: number },
  token?: string | null,
  tab?: string,
  topic?: string
) {
  const search = new URLSearchParams();
  if (params.cursor != null) search.set("cursor", String(params.cursor));
  if (params.limit != null) search.set("limit", String(params.limit));
  // backend currently ignores unknown params; safe to include for future
  if (tab) search.set("sort", tab); // or "tab", depending on future server contract
  if (topic && topic !== "all") search.set("topic", topic); // future use

  const qs = search.toString();
  return apiFetch<FeedPage>(`/api/feed${qs ? `?${qs}` : ""}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });
}
