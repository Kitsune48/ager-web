import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const apiBase = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");

const locales = ["it", "en"] as const;
const publicPaths = ["", "/philosophy"] as const;

type ArticleSearchItem = {
  articleId: number;
  publishedAt?: string | null;
};

type ArticleSearchResponse = {
  items: ArticleSearchItem[];
};

async function getRecentArticleItems(limit = 200): Promise<ArticleSearchItem[]> {
  const backendUrl = new URL(`${apiBase}/api/articles/search`);
  backendUrl.searchParams.set("q", "");
  backendUrl.searchParams.set("page", "1");
  backendUrl.searchParams.set("pageSize", String(limit));

  try {
    const res = await fetch(backendUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) return [];
    const data = (await res.json()) as ArticleSearchResponse;
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    publicPaths.map((path) => {
      const urlPath = path ? `/${locale}${path}` : `/${locale}`;
      const isHome = path === "";

      return {
        url: `${siteUrl}${urlPath}`,
        lastModified: now,
        changeFrequency: isHome ? "daily" : "weekly",
        priority: isHome ? 1 : 0.8,
      };
    })
  );

  const recentArticles = await getRecentArticleItems();
  const articleEntries: MetadataRoute.Sitemap = recentArticles.flatMap((article) =>
    locales.map((locale) => ({
      url: `${siteUrl}/${locale}/articles/${article.articleId}`,
      lastModified: article.publishedAt ? new Date(article.publishedAt) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }))
  );

  return [...staticEntries, ...articleEntries];
}
