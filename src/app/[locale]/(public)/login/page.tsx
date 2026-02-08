"use client";

import { z } from "zod";
import { PasswordSchema } from "@/lib/validation/password";
import { useAuthActions } from "@/lib/auth/session";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import RestoreAccountDialog from "@/components/auth/RestoreAccountDialog";

const schema = z.object({
  email: z.email().max(254),
  // password is optional on the server; if provided, accept as-is
  password: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export default function LoginPage() {
  const { login } = useAuthActions();
  const router = useRouter();
  const { locale } = useParams() as { locale: "it" | "en" };
  const isIt = locale === "it";
  const [errors, setErrors] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreEmail, setRestoreEmail] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors(null);
    const fd = new FormData(e.currentTarget);
    const raw = { email: String(fd.get("email") || ""), password: String(fd.get("password") || "") };
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Please check your input.";
      setErrors(first);
      return;
    }

    const submittedEmail = parsed.data.email;
    setPending(true);
    try {
      await login(parsed.data);
      router.push(`/${locale}/feed`);
    } catch (e: unknown) {
      const err = e as ApiError;

      if (err?.status === 403 && err?.code === "account_deleted") {
        setRestoreEmail(submittedEmail);
        toast(isIt ? "Account eliminato" : "Account deleted", {
          description: isIt
            ? "Questo account è stato eliminato. Vuoi ripristinarlo?"
            : "This account was deleted. Do you want to restore it?",
          action: {
            label: isIt ? "Ripristina" : "Restore",
            onClick: () => setRestoreOpen(true),
          },
        });
        setErrors(null);
        return;
      }

      toast(isIt ? "Errore di accesso" : "Login error", {
        description: (err as any)?.message ?? (isIt ? "Impossibile effettuare il login." : "Unable to sign in."),
      });
      setErrors((err as any)?.message ?? (isIt ? "Impossibile effettuare il login." : "Unable to sign in."));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-bold">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <Input name="email" type="email" required maxLength={254} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <Input name="password" type="password" placeholder="(optional) Min 8, number & special" />
        </div>
        {errors && <p className="text-sm text-destructive">{errors}</p>}
        <Button type="submit" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</Button>
      </form>

      <RestoreAccountDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        locale={locale}
        email={restoreEmail}
      />
    </main>
  );
}
