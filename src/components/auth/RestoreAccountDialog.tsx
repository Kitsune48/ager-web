"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import { restoreAccountByEmail } from "@/lib/api/restore";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: "it" | "en";
  email?: string; // optional prefill
};

function mapRestoreError(locale: "it" | "en", code?: string) {
  const it = locale === "it";
  switch (code) {
    case "user_not_found":
      return it ? "Utente non trovato." : "User not found.";
    case "user_deleted": // if your domain still returns it in some cases
      return it ? "Account già eliminato." : "Account already deleted.";
    case "invalid_old_password":
      return it ? "Password precedente non corretta." : "Incorrect old password.";
    case "account_not_deleted":
      return it ? "L’account non risulta eliminato." : "This account is not deleted.";
    default:
      return it ? "Impossibile ripristinare l’account." : "Unable to restore the account.";
  }
}

export default function RestoreAccountDialog({ open, onOpenChange, locale, email }: Props) {
  const isIt = locale === "it";
  const [formEmail, setFormEmail] = useState(email ?? "");
  const [oldPassword, setOldPassword] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (open) {
      // prefill email when opening
      setFormEmail(email ?? "");
      setOldPassword("");
    }
  }, [open, email]);

  async function onRestore() {
    const e = formEmail.trim();
    const p = oldPassword.trim();

    if (!e) {
      toast(isIt ? "Inserisci l’email" : "Enter your email");
      return;
    }
    if (!p) {
      toast(isIt ? "Inserisci la vecchia password" : "Enter your old password");
      return;
    }

    setIsPending(true);
    try {
      await restoreAccountByEmail(e, p);
      toast(isIt ? "Account ripristinato" : "Account restored", {
        description: isIt ? "Ora puoi effettuare il login." : "You can now log in.",
      });
      onOpenChange(false);
    } catch (err) {
      const e = err as ApiError;
      toast(isIt ? "Errore" : "Error", {
        description: mapRestoreError(locale, e.code) || e.message,
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isIt ? "Ripristina account" : "Restore account"}</DialogTitle>
          <DialogDescription>
            {isIt
              ? "Inserisci email e la password precedente per ripristinare l’account eliminato."
              : "Enter your email and previous password to restore the deleted account."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">{isIt ? "Email" : "Email"}</label>
            <Input
              value={formEmail}
              onChange={(ev) => setFormEmail(ev.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{isIt ? "Vecchia password" : "Old password"}</label>
            <Input
              type="password"
              value={oldPassword}
              onChange={(ev) => setOldPassword(ev.target.value)}
              autoComplete="current-password"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
            {isIt ? "Annulla" : "Cancel"}
          </Button>
          <Button onClick={onRestore} disabled={isPending}>
            {isPending ? (isIt ? "Ripristino…" : "Restoring…") : (isIt ? "Ripristina" : "Restore")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
