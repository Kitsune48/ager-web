"use client";

import { useMyListsInfinite, useDeleteList } from "@/features/lists/hooks/useReadingLists";
import CreateListDialog from "@/features/lists/components/CreateListDialog";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ReadingList } from "@/lib/api/types";
import type { InfiniteData } from "@tanstack/react-query";
import type { ReadingListPage } from "@/lib/api/readingLists";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ListsIndexPage() {
  const { locale } = useParams() as { locale: "it" | "en" };

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMyListsInfinite(20);

  const deleteList = useDeleteList();

  function visibilityLabel(
    visibility: 0 | 1 | 2 | undefined,
    locale: string
  ) {
    if (visibility === 2) return locale === "it" ? "Pubblica" : "Public";
    if (visibility === 1) return locale === "it" ? "Condivisa" : "Shared";
    return locale === "it" ? "Privata" : "Private";
  }

  const pages =
    (data as InfiniteData<ReadingListPage> | undefined)?.pages ?? [];
  const lists: ReadingList[] = pages.flatMap((page) => page.items ?? []);

  const title = locale === "it" ? "Le tue liste" : "Your lists";
  const emptyText =
    locale === "it"
      ? "Non hai ancora creato nessuna lista."
      : "You haven't created any lists yet.";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <CreateListDialog />
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground">
          {locale === "it" ? "Caricamento…" : "Loading…"}
        </div>
      )}

      {isError && (
        <div className="text-sm text-destructive">
          {locale === "it" ? "Errore nel caricare le liste." : "Failed to load lists."}
        </div>
      )}

      {!isLoading && !isError && lists.length === 0 && (
        <div className="rounded border p-3 text-sm text-muted-foreground">
          {emptyText}
        </div>
      )}

      {lists.length > 0 && (
        <ul className="divide-y rounded border">
          {lists.map((l) => (
            <li key={l.id} className="relative flex items-center gap-3 p-3">
              {/* Full-row link overlay (keeps delete button clickable) */}
              <Link
                href={`/${locale}/lists/${l.id}`}
                aria-label={locale === "it" ? `Apri lista ${l.name}` : `Open list ${l.name}`}
                className="absolute inset-0 z-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />

              {/* Left: name + visibility (pointer events pass through to overlay) */}
              <div className="pointer-events-none relative z-10 flex min-w-0 items-center gap-3">
                <span className="truncate font-medium">{l.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {visibilityLabel(l.visibility as 0 | 1 | 2 | undefined, locale)}
                </span>
              </div>

              {/* Right side: count + delete */}
              <div className="relative z-10 ml-auto flex items-center gap-2">
                {l.itemsCount != null && (
                  <span className="pointer-events-none text-xs text-muted-foreground">
                    {l.itemsCount} {locale === "it" ? "articoli" : "articles"}
                  </span>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (
                      !confirm(
                        locale === "it"
                          ? "Sei sicuro di voler eliminare questa lista?"
                          : "Are you sure you want to delete this list?"
                      )
                    ) {
                      return;
                    }
                    deleteList.mutate(l.id, {
                      onSuccess: () => {
                        toast(locale === "it" ? "Lista eliminata" : "List deleted");
                      },
                      onError: (e: any) => {
                        toast(locale === "it" ? "Errore" : "Error", {
                          description:
                            e?.message ??
                            (locale === "it"
                              ? "Impossibile eliminare la lista"
                              : "Unable to delete the list"),
                        });
                      },
                    });
                  }}
                  aria-label={locale === "it" ? "Elimina lista" : "Delete list"}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

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
