import { parseApiError } from "@/lib/api/errors";
import type { ArticleSearchResponse } from "@/lib/api/articlesSearch";

export type ArticleTagDto = {
  slug: string;
  name: string;
  keywords: string[];
};

export async function getTags(): Promise<ArticleTagDto[]> {
  const res = await fetch("/api/articles/tags", {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) throw await parseApiError(res);
  return (await res.json()) as ArticleTagDto[];
}

export async function searchByTag(args: {
  tag: string;
  page?: number;
  pageSize?: number;
}): Promise<ArticleSearchResponse> {
  const tag = args.tag.trim();
  const page = args.page && args.page > 0 ? args.page : 1;
  const pageSizeRaw = args.pageSize ?? 20;
  const pageSize = Math.min(50, Math.max(1, pageSizeRaw));

  const url = new URL(
    `/api/articles/tags/${encodeURIComponent(tag)}/search`,
    typeof window !== "undefined" ? window.location.origin : "http://localhost"
  );
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));

  const res = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) throw await parseApiError(res);
  return (await res.json()) as ArticleSearchResponse;
}
