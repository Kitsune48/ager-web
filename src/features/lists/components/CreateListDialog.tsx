"use client";

import { useState } from "react";
import { useCreateList } from "@/features/lists/hooks/useReadingLists";
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
      toast("Nome obbligatorio", {
        description: "Per favore inserisci un nome per la lista.",
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
          toast("Lista creata", {
            description:
              visibility === "public"
                ? "La lista è pubblica."
                : "La lista è privata.",
          });
          resetForm();
          setOpen(false);
        },
        onError: (e: any) => {
          toast("Errore", {
            description:
              e?.message ?? "Impossibile creare la lista in questo momento.",
          });
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm">Nuova lista</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crea una nuova lista</DialogTitle>
          <DialogDescription>
            Raccogli gli articoli che vuoi leggere o tenere da parte.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="list-name">
              Nome
            </label>
            <Input
              id="list-name"
              placeholder="Es. Da leggere questa settimana"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="list-desc">
              Descrizione (opzionale)
            </label>
            <Textarea
              id="list-desc"
              rows={3}
              placeholder="A cosa serve questa lista?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <span className="text-sm font-medium">Visibilità</span>
            <p className="text-xs text-muted-foreground">
              Puoi sempre cambiare questa impostazione in futuro (quando
              implementeremo l’editing).
            </p>
            <div className="mt-1 flex gap-2">
              <Button
                type="button"
                variant={visibility === "private" ? "default" : "outline"}
                size="sm"
                onClick={() => setVisibility("private")}
              >
                Privata
              </Button>
              <Button
                type="button"
                variant={visibility === "public" ? "default" : "outline"}
                size="sm"
                onClick={() => setVisibility("public")}
              >
                Pubblica
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Crea
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
