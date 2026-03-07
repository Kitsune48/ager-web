import { API_BASE } from "@/lib/api/client";

export type ArticleDto = {
  articleId: number;
  title: string;
  url: string;
  canonicalUrl?: string | null;
  excerpt?: string | null;
  imageUrl?: string | null;
  sourceName?: string | null;
  publishedAt?: string | null;
  author?: string | null;
  lang?: string | null;
};

export async function getArticlePublic(articleId: number): Promise<ArticleDto> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser ? `/api/articles/${articleId}` : `${API_BASE}/api/articles/${articleId}`;

  const res = await fetch(url, { method: "GET", cache: "no-store" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `GET /api/articles/${articleId} failed: ${res.status}`);
  }

  return res.json();
}
