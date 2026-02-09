"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  useMyLists,
  useAddToList,
} from "@/features/lists/hooks/useReadingLists";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { ReadingList } from "@/lib/api/types";

const LAST_LIST_KEY = "ager:lastListId";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: number;
  articleTitle: string;
};

export default function AddToListDialog({
  open,
  onOpenChange,
  articleId,
  articleTitle,
}: Props) {
  const { locale } = useParams() as { locale?: "it" | "en" };
  const isIt = locale !== "en";

  const { data: lists, isLoading, isError } = useMyLists();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [note, setNote] = useState("");

  // Preselect last used list when dialog opens
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(LAST_LIST_KEY);
      if (raw) {
        const n = Number(raw);
        if (Number.isFinite(n)) setSelectedId(n);
      }
    } catch {
      // ignore
    }
  }, [open]);

  const typedLists = lists as ReadingList[] | undefined;

  const targetList = useMemo(
    () => typedLists?.find((l) => l.id === selectedId) ?? null,
    [typedLists, selectedId]
  );

  // Current hook signature: mutate({ readingListId, articleId, note? })
  const addMutation = useAddToList();

  function handleSave() {
    if (!selectedId) {
      toast(isIt ? "Seleziona una lista" : "Select a list", {
        description: isIt
          ? "Scegli una lista in cui salvare l'articolo."
          : "Choose a list where you want to save the article.",
      });
      return;
    }

    const trimmedNote = note.trim();

    addMutation.mutate(
      {
        readingListId: selectedId,
        articleId,
        note: trimmedNote.length > 0 ? trimmedNote : undefined,
      },
      {
        onSuccess: () => {
          localStorage.setItem(LAST_LIST_KEY, String(selectedId));
          toast(isIt ? "Articolo salvato" : "Article saved", {
            description: targetList
              ? isIt
                ? `Aggiunto a “${targetList.name}”.`
                : `Added to “${targetList.name}”.`
              : isIt
                ? "Aggiunto alla lista selezionata."
                : "Added to the selected list.",
          });
          setNote("");
          onOpenChange(false);
        },
        onError: (e: any) => {
          toast(isIt ? "Errore" : "Error", {
            description:
              e?.message ??
              (isIt
                ? "Impossibile salvare l'articolo nella lista."
                : "Unable to save the article to the list."),
          });
        },
      }
    );
  }

  const hasLists = !!typedLists && typedLists.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isIt ? "Salva in una lista" : "Save to a list"}</DialogTitle>
          <DialogDescription className="mt-1">
            {isIt
              ? "Scegli una delle tue liste di lettura per salvare:"
              : "Choose one of your reading lists to save:"}
            <br />
            <span className="font-medium">{articleTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <p className="text-sm text-muted-foreground">
            {isIt ? "Caricamento liste…" : "Loading lists…"}
          </p>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            {isIt ? "Errore nel caricare le liste." : "Failed to load lists."}
          </p>
        )}

        {!isLoading && !isError && !hasLists && (
          <p className="text-sm text-muted-foreground">
            {isIt
              ? "Non hai ancora creato nessuna lista. Crea una lista dalla sezione “Liste”."
              : "You haven't created any lists yet. Create one from the “Lists” section."}
          </p>
        )}

        {hasLists && (
          <>
            {/* Select list */}
            <div className="mt-3 space-y-2">
              <label className="text-sm font-medium" htmlFor="list-select">
                {isIt ? "Lista" : "List"}
              </label>
              <select
                id="list-select"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={selectedId ? String(selectedId) : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedId(v ? Number(v) : null);
                }}
              >
                <option value="">{isIt ? "Seleziona una lista…" : "Select a list…"}</option>
                {typedLists!.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                    {l.itemsCount != null
                      ? ` (${l.itemsCount} ${isIt ? "articoli" : "articles"})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional note */}
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium" htmlFor="note-textarea">
                {isIt ? "Nota (opzionale)" : "Note (optional)"}
              </label>
              <Textarea
                id="note-textarea"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  isIt
                    ? "Aggiungi un appunto per ricordarti perché hai salvato questo articolo…"
                    : "Add a note to remember why you saved this article…"
                }
              />
            </div>
          </>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {isIt ? "Annulla" : "Cancel"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={addMutation.isPending || !hasLists}
          >
            {addMutation.isPending
              ? isIt
                ? "Salvataggio…"
                : "Saving…"
              : isIt
                ? "Salva"
                : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
