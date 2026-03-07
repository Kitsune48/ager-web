import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

const locales = ["it", "en"] as const;
const publicPaths = ["", "/philosophy"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return locales.flatMap((locale) =>
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
}
