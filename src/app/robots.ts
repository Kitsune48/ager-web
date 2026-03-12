import type { MetadataRoute } from "next";

const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "CCBot",
  "anthropic-ai",
  "ClaudeBot",
  "Claude-Web",
  "Google-Extended",
  "Bytespider",
  "PerplexityBot",
  "Amazonbot",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          "/it/feed",
          "/en/feed",
          "/it/explore",
          "/en/explore",
          "/it/search",
          "/en/search",
          "/it/lists",
          "/en/lists",
          "/it/profile",
          "/en/profile",
          "/it/login",
          "/en/login",
          "/it/register",
          "/en/register",
          "/it/forgot-password",
          "/en/forgot-password",
        ],
      },
      ...AI_BOTS.map((bot) => ({
        userAgent: bot,
        disallow: "/",
      })),
    ],
    sitemap: siteUrl ? `${siteUrl}/sitemap.xml` : undefined,
  };
}
