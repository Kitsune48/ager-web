"use client";

import Link from "next/link";
import { z } from "zod";
import { useAuthActions } from "@/lib/auth/session";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import RestoreAccountDialog from "@/components/auth/RestoreAccountDialog";

const REQUEST_SCHEMA = z.object({
  email: z.email().max(254),
});

const VERIFY_SCHEMA = z.object({
  otpCode: z
    .string()
    .regex(/^\d{6}$/),
});

const PASSWORD_SCHEMA = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
});

const RESEND_COOLDOWN_MS = 30_000;

export default function LoginPage() {
  const { requestLoginOtp, login } = useAuthActions();
  const router = useRouter();
  const { locale } = useParams() as { locale: "it" | "en" };
  const isIt = locale === "it";
  const [errors, setErrors] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreEmail, setRestoreEmail] = useState<string>("");
  const [method, setMethod] = useState<"otp" | "password">("otp");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (step !== "verify" || !resendAvailableAt) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [step, resendAvailableAt]);

  const resendSecondsLeft = useMemo(() => {
    if (!resendAvailableAt) return 0;
    return Math.max(0, Math.ceil((resendAvailableAt - now) / 1000));
  }, [resendAvailableAt, now]);

  const canResend = step === "verify" && resendSecondsLeft === 0;

  function resetOtpFlow() {
    setStep("request");
    setOtpCode("");
    setResendAvailableAt(null);
  }

  function resetMessages() {
    setErrors(null);
    setInfo(null);
  }

  async function onRequestCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetMessages();

    const parsed = REQUEST_SCHEMA.safeParse({ email });
    if (!parsed.success) {
      setErrors(isIt ? "Inserisci una email valida." : "Enter a valid email.");
      return;
    }

    setPending(true);
    try {
      await requestLoginOtp(parsed.data.email);
      setInfo(
        isIt
          ? "Se l’account esiste riceverai un codice via email."
          : "If the account exists, you’ll receive a code by email."
      );
      setStep("verify");
      setResendAvailableAt(Date.now() + RESEND_COOLDOWN_MS);
    } catch (e: unknown) {
      const err = e as ApiError;
      if (err?.status === 429) {
        setErrors(isIt ? "Troppi tentativi, riprova tra poco." : "Too many attempts, try again later.");
      } else {
        setErrors(err?.message ?? (isIt ? "Impossibile inviare il codice." : "Unable to send the code."));
      }
    } finally {
      setPending(false);
    }
  }

  async function onVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetMessages();

    const parsed = VERIFY_SCHEMA.safeParse({ otpCode });
    if (!parsed.success) {
      setErrors(isIt ? "Inserisci un codice di 6 cifre." : "Enter a 6-digit code.");
      return;
    }

    setPending(true);
    try {
      await login({ email, otpCode: parsed.data.otpCode });
      router.push(`/${locale}/feed`);
    } catch (e: unknown) {
      const err = e as ApiError;

      if (err?.status === 401) {
        setErrors(isIt ? "Codice non valido o scaduto." : "Invalid or expired code.");
      } else if (err?.status === 403) {
        setErrors(isIt ? "Account disabilitato/eliminato." : "Account disabled/deleted.");

        if (err?.code === "account_deleted") {
          setRestoreEmail(email);
          toast(isIt ? "Account eliminato" : "Account deleted", {
            description: isIt
              ? "Questo account è stato eliminato. Vuoi ripristinarlo?"
              : "This account was deleted. Do you want to restore it?",
            action: {
              label: isIt ? "Ripristina" : "Restore",
              onClick: () => setRestoreOpen(true),
            },
          });
        }
      } else if (err?.status === 404) {
        setErrors(isIt ? "Account non trovato." : "Account not found.");
      } else {
        setErrors(err?.message ?? (isIt ? "Impossibile effettuare il login." : "Unable to sign in."));
      }
    } finally {
      setPending(false);
    }
  }

  async function onResend() {
    resetMessages();
    setPending(true);
    try {
      await requestLoginOtp(email);
      setInfo(
        isIt
          ? "Se l’account esiste riceverai un codice via email."
          : "If the account exists, you’ll receive a code by email."
      );
      setResendAvailableAt(Date.now() + RESEND_COOLDOWN_MS);
    } catch (e: unknown) {
      const err = e as ApiError;
      if (err?.status === 429) {
        setErrors(isIt ? "Troppi tentativi, riprova tra poco." : "Too many attempts, try again later.");
      } else {
        setErrors(err?.message ?? (isIt ? "Impossibile inviare il codice." : "Unable to send the code."));
      }
    } finally {
      setPending(false);
    }
  }

  async function onPasswordLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetMessages();

    const parsed = PASSWORD_SCHEMA.safeParse({ email, password });
    if (!parsed.success) {
      // keep it simple & localized
      if (!email.trim()) setErrors(isIt ? "Inserisci la tua email." : "Enter your email.");
      else if (!password.trim()) setErrors(isIt ? "Inserisci la password." : "Enter your password.");
      else setErrors(isIt ? "Controlla i dati inseriti." : "Please check your input.");
      return;
    }

    setPending(true);
    try {
      await login({ email: parsed.data.email, password: parsed.data.password });
      router.push(`/${locale}/feed`);
    } catch (e: unknown) {
      const err = e as ApiError;

      if (err?.status === 401) {
        setErrors(isIt ? "Credenziali non valide." : "Invalid credentials.");
      } else if (err?.status === 403) {
        setErrors(isIt ? "Account disabilitato/eliminato." : "Account disabled/deleted.");

        if (err?.code === "account_deleted") {
          setRestoreEmail(email);
          toast(isIt ? "Account eliminato" : "Account deleted", {
            description: isIt
              ? "Questo account è stato eliminato. Vuoi ripristinarlo?"
              : "This account was deleted. Do you want to restore it?",
            action: {
              label: isIt ? "Ripristina" : "Restore",
              onClick: () => setRestoreOpen(true),
            },
          });
        }
      } else if (err?.status === 404) {
        setErrors(isIt ? "Account non trovato." : "Account not found.");
      } else {
        setErrors(err?.message ?? (isIt ? "Impossibile effettuare il login." : "Unable to sign in."));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-bold">{isIt ? "Accedi" : "Sign in"}</h1>

      {method === "password" ? (
        <form onSubmit={onPasswordLogin} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <Input
              name="email"
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">{isIt ? "Password" : "Password"}</label>
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
            />
          </div>
          {info && <p className="text-sm text-muted-foreground">{info}</p>}
          {errors && <p className="text-sm text-destructive">{errors}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? (isIt ? "Accesso..." : "Signing in...") : (isIt ? "Accedi" : "Sign in")}
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setMethod("otp");
              resetMessages();
              resetOtpFlow();
            }}
          >
            {isIt ? "Accedi con codice invece" : "Use code instead"}
          </Button>
        </form>
      ) : step === "request" ? (
        <form onSubmit={onRequestCode} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <Input
              name="email"
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
            />
          </div>
          {info && <p className="text-sm text-muted-foreground">{info}</p>}
          {errors && <p className="text-sm text-destructive">{errors}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? (isIt ? "Invio..." : "Sending...") : (isIt ? "Richiedi codice" : "Request code")}
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setMethod("password");
              resetMessages();
              resetOtpFlow();
            }}
          >
            {isIt ? "Accedi con password invece" : "Sign in with password instead"}
          </Button>
        </form>
      ) : (
        <form onSubmit={onVerify} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <Input name="email" type="email" value={email} disabled />
          </div>
          <div>
            <label className="mb-1 block text-sm">OTP</label>
            <Input
              name="otpCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={isIt ? "6 cifre" : "6 digits"}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={pending}
            />
          </div>
          {info && <p className="text-sm text-muted-foreground">{info}</p>}
          {errors && <p className="text-sm text-destructive">{errors}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? (isIt ? "Verifica..." : "Verifying...") : (isIt ? "Verifica" : "Verify")}
            </Button>
            <Button type="button" variant="secondary" disabled={pending || !canResend} onClick={onResend}>
              {isIt ? "Invia di nuovo" : "Resend"}{resendSecondsLeft > 0 ? ` (${resendSecondsLeft}s)` : ""}
            </Button>
          </div>
          <div className="flex flex-col items-start gap-1">
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                resetMessages();
                resetOtpFlow();
              }}
            >
              {isIt ? "Cambia email" : "Change email"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setMethod("password");
                resetMessages();
                resetOtpFlow();
              }}
            >
              {isIt ? "Accedi con password invece" : "Sign in with password instead"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-4 text-sm">
        <Link href={`/${locale}/forgot-password`} className="text-muted-foreground hover:underline">
          {isIt ? "Password dimenticata?" : "Forgot password?"}
        </Link>
      </div>

      <RestoreAccountDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        locale={locale}
        email={restoreEmail}
      />
    </main>
  );
}
