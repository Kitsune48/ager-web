"use client";

import { useState } from "react";
import { useCreateList } from "@/features/lists/hooks/useReadingLists";
import { useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function CreateListDialog() {
  const { locale } = useParams() as { locale?: "it" | "en" };
  const isIt = locale !== "en";

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");

  const create = useCreateList();

  function resetForm() {
    setName("");
    setDescription("");
    setVisibility("private");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast(isIt ? "Nome obbligatorio" : "Name required", {
        description: isIt
          ? "Per favore inserisci un nome per la lista."
          : "Please enter a name for the list.",
      });
      return;
    }

    create.mutate(
      {
        name: name.trim(),
        description: description.trim() || null,
        isPublic: visibility === "public",
      },
      {
        onSuccess: () => {
          toast(isIt ? "Lista creata" : "List created", {
            description:
              visibility === "public"
                ? isIt
                  ? "La lista è pubblica."
                  : "The list is public."
                : isIt
                  ? "La lista è privata."
                  : "The list is private.",
          });
          resetForm();
          setOpen(false);
        },
        onError: (e: any) => {
          toast(isIt ? "Errore" : "Error", {
            description:
              e?.message ??
              (isIt
                ? "Impossibile creare la lista in questo momento."
                : "Unable to create the list right now."),
          });
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm">{isIt ? "Nuova lista" : "New list"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isIt ? "Crea una nuova lista" : "Create a new list"}</DialogTitle>
          <DialogDescription>
            {isIt
              ? "Raccogli gli articoli che vuoi leggere o tenere da parte."
              : "Collect articles you want to read or save for later."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="list-name">
              {isIt ? "Nome" : "Name"}
            </label>
            <Input
              id="list-name"
              placeholder={
                isIt
                  ? "Es. Da leggere questa settimana"
                  : "e.g. To read this week"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="list-desc">
              {isIt ? "Descrizione (opzionale)" : "Description (optional)"}
            </label>
            <Textarea
              id="list-desc"
              rows={3}
              placeholder={
                isIt
                  ? "A cosa serve questa lista?"
                  : "What is this list for?"
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <span className="text-sm font-medium">{isIt ? "Visibilità" : "Visibility"}</span>
            <p className="text-xs text-muted-foreground">
              {isIt
                ? "Puoi sempre cambiare questa impostazione in futuro (quando implementeremo l’editing)."
                : "You can change this setting later (when editing is implemented)."}
            </p>
            <div className="mt-1 flex gap-2">
              <Button
                type="button"
                variant={visibility === "private" ? "default" : "outline"}
                size="sm"
                onClick={() => setVisibility("private")}
              >
                {isIt ? "Privata" : "Private"}
              </Button>
              <Button
                type="button"
                variant={visibility === "public" ? "default" : "outline"}
                size="sm"
                onClick={() => setVisibility("public")}
              >
                {isIt ? "Pubblica" : "Public"}
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              {isIt ? "Annulla" : "Cancel"}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {isIt ? "Crea" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
