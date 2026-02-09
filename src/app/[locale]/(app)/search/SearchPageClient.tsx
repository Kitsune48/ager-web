"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { searchArticlesPublic } from "@/lib/api/articlesSearch";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import SearchResultRow from "@/features/search/components/SearchResultRow";
import { Button } from "@/components/ui/button";

function clampPage(n: number) {
  return Number.isFinite(n) && n > 0 ? n : 1;
}
function clampPageSize(n: number) {
  if (n === 10 || n === 20 || n === 50) return n;
  return 20;
}

export default function SearchPageClient() {
  const { locale } = useParams() as { locale: "it" | "en" };
  const router = useRouter();
  const sp = useSearchParams();

  const qParam = sp.get("q") ?? "";
  const page = clampPage(Number(sp.get("page") ?? "1"));
  const pageSize = clampPageSize(Number(sp.get("pageSize") ?? "20"));

  const [qInput, setQInput] = useState(qParam);
  useEffect(() => setQInput(qParam), [qParam]);

  const debounced = useDebouncedValue(qInput, 300);
  const q = debounced.trim();

  // keep URL in sync (bookmark/share)
  useEffect(() => {
    const current = (sp.get("q") ?? "").trim();
    if (q === current) return;

    const next = new URLSearchParams(sp.toString());
    if (!q) {
      next.delete("q");
      next.delete("page");
    } else {
      next.set("q", q);
      next.set("page", "1");
    }
    router.replace(`/${locale}/search?${next.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, locale]);

  const query = useQuery({
    queryKey: ["articleSearchPublic", q, page, pageSize],
    queryFn: () => searchArticlesPublic({ q, page, pageSize }),
    enabled: q.length > 0,
    staleTime: 20_000,
    retry: 1,
  });

  const totalPages = useMemo(() => {
    const total = query.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [query.data?.total, pageSize]);

  function setPage(nextPage: number) {
    const next = new URLSearchParams(sp.toString());
    next.set("page", String(Math.min(Math.max(1, nextPage), totalPages)));
    router.push(`/${locale}/search?${next.toString()}`);
  }

  function setPageSize(nextSize: number) {
    const next = new URLSearchParams(sp.toString());
    next.set("pageSize", String(nextSize));
    next.set("page", "1");
    router.push(`/${locale}/search?${next.toString()}`);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">{locale === "it" ? "Cerca" : "Search"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {locale === "it" ? "Ricerca full-text tra gli articoli." : "Full-text search across articles."}
        </p>
      </div>

      {/* Input (page-local) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder={locale === "it" ? "Es: aggiornamenti ucraina" : "E.g. ukraine news"}
        />

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{locale === "it" ? "Per pagina:" : "Per page:"}</span>
          <select
            className="h-10 rounded-md border bg-background px-2 text-sm"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        {!q && (
          <div className="rounded border p-4 text-sm text-muted-foreground">
            {locale === "it" ? "Inserisci una query per iniziare." : "Type a query to start."}
          </div>
        )}

        {q && query.isLoading && (
          <div className="text-sm text-muted-foreground">{locale === "it" ? "Ricerca in corso…" : "Searching…"}</div>
        )}

        {q && query.isError && (
          <div className="rounded border border-destructive/40 p-4 text-sm text-destructive">
            {locale === "it" ? "Errore durante la ricerca." : "Search failed."}
            <div className="mt-2 text-xs text-muted-foreground">
              {locale === "it"
                ? "Impossibile completare la richiesta. Riprova tra poco."
                : "We couldn't complete the request. Please try again."}
            </div>
          </div>
        )}

        {q && query.data && query.data.items.length === 0 && (
          <div className="rounded border p-4 text-sm text-muted-foreground">{locale === "it" ? "Nessun risultato." : "No results."}</div>
        )}

        {q && query.data && query.data.items.length > 0 && (
          <>
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{locale === "it" ? `Risultati: ${query.data.total}` : `Results: ${query.data.total}`}</span>
              <span>{locale === "it" ? `Pagina ${page} di ${totalPages}` : `Page ${page} of ${totalPages}`}</span>
            </div>

            <div className="space-y-3">
              {query.data.items.map((it) => (
                <SearchResultRow key={it.articleId} {...it} />
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between pb-2">
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                {locale === "it" ? "Precedente" : "Previous"}
              </Button>

              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                {locale === "it" ? "Successiva" : "Next"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
