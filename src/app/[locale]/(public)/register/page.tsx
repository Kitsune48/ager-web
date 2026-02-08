"use client";

import { z } from "zod";
import { PasswordSchema } from "@/lib/validation/password";
import { useAuthActions } from "@/lib/auth/session";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const schema = z.object({
  username: z.string().min(1).max(30),
  email: z.email().max(254),
  password: PasswordSchema
});

export default function RegisterPage() {
  const { register } = useAuthActions();
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale ?? "it";
  const [errors, setErrors] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors(null);
    const fd = new FormData(e.currentTarget);
    const raw = {
      username: String(fd.get("username") || ""),
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || "")
    };
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Please check your input.";
      setErrors(first);
      return;
    }
    setPending(true);
    try {
      await register(parsed.data);
      router.push(`/${locale}/feed`);
    } catch (err: any) {
      setErrors(err?.message ?? "Register failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-bold">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm">Username</label>
          <Input name="username" required maxLength={30} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <Input name="email" type="email" required maxLength={254} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <Input name="password" type="password" required placeholder="Min 8, number & special" />
        </div>
        {errors && <p className="text-sm text-destructive">{errors}</p>}
        <Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create account"}</Button>
      </form>
    </main>
  );
}
