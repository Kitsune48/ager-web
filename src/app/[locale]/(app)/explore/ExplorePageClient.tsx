"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import TagBar from "@/features/search/components/TagBar";
import { getTags, type ArticleTagDto } from "@/lib/api/articlesTags";

export default function ExplorePageClient() {
  const { locale } = useParams() as { locale: "it" | "en" };
  const isIt = locale === "it";
  const router = useRouter();

  const [qInput, setQInput] = useState("");

  const tagsQuery = useQuery({
    queryKey: ["articleTags"],
    queryFn: () => getTags(),
    staleTime: 60_000,
    retry: 1,
  });

  const fallbackTags = useMemo((): ArticleTagDto[] => {
    return [
      { slug: "tech", name: isIt ? "Tecnologia" : "Technology", keywords: [] },
      { slug: "business", name: isIt ? "Business" : "Business", keywords: [] },
      { slug: "design", name: isIt ? "Design" : "Design", keywords: [] },
      { slug: "ai", name: isIt ? "AI" : "AI", keywords: [] },
    ];
  }, [isIt]);

  const tagsToRender = tagsQuery.isError ? fallbackTags : tagsQuery.data ?? [];

  const hrefForTag = (slug: string | null) => {
    if (!slug) return `/${locale}/search`;
    return `/${locale}/search?tag=${encodeURIComponent(slug)}&page=1&pageSize=20`;
  };

  if (tagsQuery.isError) {
    toast(isIt ? "Errore caricando i tag" : "Failed to load tags");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">{isIt ? "Esplora" : "Explore"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isIt ? "Cerca e scopri articoli per tag." : "Search and discover articles by tag."}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = qInput.trim();
          if (!q) return;
          router.push(`/${locale}/search?q=${encodeURIComponent(q)}&page=1&pageSize=20`);
        }}
        className="mt-6 flex flex-col items-center gap-3"
      >
        <input
          className="h-10 w-full max-w-xl rounded-md border bg-background px-3 text-sm"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder={isIt ? "Cerca…" : "Search…"}
        />
      </form>

      <TagBar
        locale={locale}
        tags={tagsToRender.map((t) => ({ slug: t.slug, name: t.name }))}
        selectedTag={null}
        hrefForTag={hrefForTag}
        loading={tagsQuery.isLoading}
        showFallbackNote={tagsQuery.isError}
      />
    </div>
  );
}
