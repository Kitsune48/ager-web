"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  useListItemsInfinite,
  useMyLists,
  useRemoveFromList,
} from "@/features/lists/hooks/useReadingLists";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ReadingList, ReadingListItem } from "@/lib/api/types";
import type { InfiniteData } from "@tanstack/react-query";
import type { ReadingListItemsPage } from "@/lib/api/readingLists";

export default function ListDetailPage() {
  const { locale, id } = useParams() as { locale: "it" | "en"; id: string };
  const listId = Number(id);

  const { data: listsData } = useMyLists();
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useListItemsInfinite(listId, 20);
  const remove = useRemoveFromList(listId);

  const lists = (listsData ?? []) as ReadingList[];
  const list = lists.find((l) => l.id === listId);

  if (!Number.isFinite(listId)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <p className="text-sm text-destructive">ID lista non valido.</p>
      </div>
    );
  }

  // Explicitly treat data as InfiniteData<ReadingListItemsPage>
  const pages =
    (data as InfiniteData<ReadingListItemsPage> | undefined)?.pages ?? [];
  const items: ReadingListItem[] = pages.flatMap(
    (page) => page.items ?? []
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      {/* Back link */}
      <div className="mb-2 text-sm text-muted-foreground">
        <Link href={`/${locale}/lists`} className="hover:underline">
          ← {locale === "it" ? "Tutte le liste" : "All lists"}
        </Link>
      </div>

      {/* Header */}
      <h1 className="mb-1 text-2xl font-semibold">
        {list?.name ?? (locale === "it" ? "Lista" : "List")}
      </h1>
      {list?.createdAt && (
        <p className="mb-4 text-xs text-muted-foreground">
          {locale === "it" ? "Creata il " : "Created on "}
          {new Date(list.createdAt).toLocaleDateString(locale)}
        </p>
      )}

      {/* Loading / error / empty states */}
      {isLoading && (
        <div className="text-sm text-muted-foreground">Caricamento…</div>
      )}

      {isError && (
        <div className="text-sm text-destructive">
          Errore nel caricare gli articoli.
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="rounded border p-3 text-sm text-muted-foreground">
          {locale === "it"
            ? "Nessun articolo in questa lista."
            : "No articles in this list yet."}
        </div>
      )}

      {/* Articles in the list */}
      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((it) => {
            // derive reading time from wordCount if available
            const minutes =
              it.wordCount != null
                ? Math.max(1, Math.round(it.wordCount / 200))
                : null;

            return (
              <li
                key={`${it.listId}-${it.articleId}`}
                className="grid gap-3 rounded border p-3 sm:grid-cols-[1fr,200px]"
              >
                <div>
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:underline"
                  >
                    {it.title}
                  </a>

                  {/* Optional user note on the item */}
                  {it.note && (
                    <p className="mt-1 text-sm text-muted-foreground italic">
                      {it.note}
                    </p>
                  )}

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {it.sourceName && <span>{it.sourceName}</span>}

                    {it.publishedAt && (
                      <>
                        {it.sourceName && <span>•</span>}
                        <span>
                          {new Date(it.publishedAt).toLocaleDateString(locale)}
                        </span>
                      </>
                    )}

                    {minutes && (
                      <>
                        <span>•</span>
                        <span>{minutes} min</span>
                      </>
                    )}
                  </div>

                  {/* Remove button */}
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 text-xs text-destructive hover:text-destructive"
                      onClick={() => {
                        const confirmText =
                          locale === "it"
                            ? "Rimuovere questo articolo dalla lista?"
                            : "Remove this article from the list?";
                        if (!confirm(confirmText)) return;

                        remove.mutate(it.articleId, {
                          onSuccess: () => {
                            toast(
                              locale === "it"
                                ? "Articolo rimosso dalla lista"
                                : "Article removed from list"
                            );
                          },
                          onError: (err: any) => {
                            toast("Errore", {
                              description:
                                err?.message ??
                                (locale === "it"
                                  ? "Impossibile rimuovere l'articolo"
                                  : "Unable to remove article"),
                            });
                          },
                        });
                      }}
                      disabled={remove.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>
                        {locale === "it" ? "Rimuovi" : "Remove"}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Optional image on the right */}
                {it.imageUrl && (
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full"
                  >
                    <Image
                      src={it.imageUrl}
                      alt=""
                      width={800}
                      height={450}
                      className="h-40 w-full rounded-md object-cover sm:h-28"
                      sizes="(max-width: 640px) 100vw, 200px"
                    />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Load more */}
      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage
              ? locale === "it"
                ? "Caricamento…"
                : "Loading…"
              : locale === "it"
              ? "Carica altri"
              : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
