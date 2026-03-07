"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import TagBar from "@/features/search/components/TagBar";
import SearchResultRow from "@/features/search/components/SearchResultRow";
import { Button } from "@/components/ui/button";
import { getTags, searchByTag, type ArticleTagDto } from "@/lib/api/articlesTags";

function clampPage(n: number) {
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function clampPageSize(n: number) {
  if (n === 10 || n === 20 || n === 50) return n;
  return 20;
}

export default function ExplorePageClient() {
  const { locale } = useParams() as { locale: "it" | "en" };
  const isIt = locale === "it";
  const router = useRouter();
  const sp = useSearchParams();

  const [qInput, setQInput] = useState("");
  const selectedTag = (sp.get("tag") ?? "").trim() || null;
  const page = clampPage(Number(sp.get("page") ?? "1"));
  const pageSize = clampPageSize(Number(sp.get("pageSize") ?? "20"));

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
    const next = new URLSearchParams(sp.toString());
    if (!slug) next.delete("tag");
    else next.set("tag", slug);
    next.set("page", "1");
    next.set("pageSize", String(pageSize));
    return `/${locale}/explore?${next.toString()}`;
  };

  const resultsQuery = useQuery({
    queryKey: ["exploreTagSearch", selectedTag, page, pageSize],
    queryFn: () => searchByTag({ tag: selectedTag!, page, pageSize }),
    enabled: selectedTag !== null,
    staleTime: 20_000,
    retry: 1,
  });

  const totalPages = useMemo(() => {
    const total = resultsQuery.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [resultsQuery.data?.total, pageSize]);

  useEffect(() => {
    if (tagsQuery.isError) {
      toast(isIt ? "Errore caricando i tag" : "Failed to load tags");
    }
  }, [tagsQuery.isError, isIt]);

  useEffect(() => {
    if (!resultsQuery.isError) return;
    toast(isIt ? "Errore caricando gli articoli" : "Failed to load articles");
  }, [resultsQuery.isError, isIt]);

  function setPage(nextPage: number) {
    const next = new URLSearchParams(sp.toString());
    next.set("page", String(Math.min(Math.max(1, nextPage), totalPages)));
    next.set("pageSize", String(pageSize));
    router.push(`/${locale}/explore?${next.toString()}`);
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
        selectedTag={selectedTag}
        hrefForTag={hrefForTag}
        loading={tagsQuery.isLoading}
        showFallbackNote={tagsQuery.isError}
      />

      <div className="mt-6">
        {!selectedTag && (
          <div className="rounded border p-4 text-sm text-muted-foreground">
            {isIt ? "Seleziona un topic per esplorare gli articoli." : "Select a topic to explore articles."}
          </div>
        )}

        {selectedTag && resultsQuery.isLoading && (
          <div className="text-sm text-muted-foreground">{isIt ? "Caricamento articoli…" : "Loading articles…"}</div>
        )}

        {selectedTag && resultsQuery.data && resultsQuery.data.items.length === 0 && (
          <div className="rounded border p-4 text-sm text-muted-foreground">
            {isIt ? "Nessun articolo per questo topic." : "No articles for this topic."}
          </div>
        )}

        {selectedTag && resultsQuery.data && resultsQuery.data.items.length > 0 && (
          <>
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{isIt ? `Risultati: ${resultsQuery.data.total}` : `Results: ${resultsQuery.data.total}`}</span>
              <span>{isIt ? `Pagina ${page} di ${totalPages}` : `Page ${page} of ${totalPages}`}</span>
            </div>

            <div className="space-y-3">
              {resultsQuery.data.items.map((item) => (
                <SearchResultRow key={item.articleId} {...item} />
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                {isIt ? "Precedente" : "Previous"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                {isIt ? "Successiva" : "Next"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
