import { parseApiError } from "@/lib/api/errors";

export async function restoreAccountByEmail(email: string, oldPassword: string): Promise<void> {
  const res = await fetch("/api/auth/restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, oldPassword }),
  });

  if (!res.ok) throw await parseApiError(res);
}
