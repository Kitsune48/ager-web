import { API_BASE } from "@/lib/api/client";

export type ArticleSearchItem = {
  articleId: number;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  sourceName: string;
  publishedAt: string;
};

export type ArticleSearchResponse = {
  items: ArticleSearchItem[];
  total: number;
  page: number;
  pageSize: number;
};

export async function searchArticles(args: {
  q: string;
  page?: number;
  pageSize?: number;
  accessToken?: string;
}): Promise<ArticleSearchResponse> {
  const q = args.q.trim();
  const page = args.page && args.page > 0 ? args.page : 1;
  const pageSizeRaw = args.pageSize ?? 20;
  const pageSize = Math.min(50, Math.max(1, pageSizeRaw));

  const url = new URL(`${API_BASE}/api/articles/search`);
  url.searchParams.set("q", q);
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: args.accessToken ? { Authorization: `Bearer ${args.accessToken}` } : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `GET /api/articles/search failed: ${res.status}`);
  }

  return res.json();
}

// Legacy helper that keeps public search behavior (no auth header required)
export async function searchArticlesPublic(args: {
  q: string;
  page?: number;
  pageSize?: number;
}): Promise<ArticleSearchResponse> {
  return searchArticles(args);
}
