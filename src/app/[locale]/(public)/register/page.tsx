"use client";

import { z } from "zod";
import { PasswordSchema } from "@/lib/validation/password";
import { useAuthActions } from "@/lib/auth/session";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { ApiError, getProblemDetailsFieldErrors } from "@/lib/api/errors";

const REQUEST_SCHEMA = z.object({
  username: z.string().min(1).max(30),
  email: z.email().max(254),
});

const VERIFY_SCHEMA = z.object({
  otpCode: z
    .string()
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
  // optional: if provided, must satisfy PasswordSchema
  password: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .superRefine((v, ctx) => {
      if (v === undefined) return;
      const parsed = PasswordSchema.safeParse(v);
      if (!parsed.success) {
        ctx.addIssue({ code: "custom", message: parsed.error.issues[0]?.message ?? "Invalid password" });
      }
    }),
});

const RESEND_COOLDOWN_MS = 30_000;

export default function RegisterPage() {
  const { requestRegisterOtp, register } = useAuthActions();
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale ?? "it";
  const isIt = locale === "it";
  const [errors, setErrors] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [step, setStep] = useState<"request" | "verify">("request");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState<string>("");
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

  async function onRequestCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors(null);
    setFieldErrors({});
    setInfo(null);

    const parsed = REQUEST_SCHEMA.safeParse({ username, email });
    if (!parsed.success) {
      setErrors(parsed.error.issues[0]?.message ?? (isIt ? "Controlla i dati inseriti." : "Please check your input."));
      return;
    }

    setPending(true);
    try {
      await requestRegisterOtp({ username: parsed.data.username, email: parsed.data.email });
      setInfo(isIt ? "Ti abbiamo inviato un codice via email." : "We sent you a code by email.");
      setStep("verify");
      setResendAvailableAt(Date.now() + RESEND_COOLDOWN_MS);
    } catch (e: unknown) {
      const err = e as ApiError;
      if (err?.status === 429) {
        setErrors(isIt ? "Troppi tentativi, riprova tra poco." : "Too many attempts, try again later.");
      } else if (err?.status === 409) {
        if (err?.code === "email_already_registered") {
          setErrors(isIt ? "Email già registrata." : "Email already registered.");
        } else if (err?.code === "username_already_registered") {
          setErrors(isIt ? "Username già in uso." : "Username already taken.");
        } else {
          setErrors(err?.message ?? (isIt ? "Registrazione non disponibile." : "Registration not available."));
        }
      } else {
        setErrors(err?.message ?? (isIt ? "Impossibile inviare il codice." : "Unable to send the code."));
      }
    } finally {
      setPending(false);
    }
  }

  async function onVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors(null);
    setFieldErrors({});

    const parsed = VERIFY_SCHEMA.safeParse({ otpCode, password });
    if (!parsed.success) {
      setErrors(parsed.error.issues[0]?.message ?? (isIt ? "Controlla i dati inseriti." : "Please check your input."));
      return;
    }

    setPending(true);
    try {
      await register({
        username,
        email,
        otpCode: parsed.data.otpCode,
        password: parsed.data.password,
      });
      router.push(`/${locale}/feed`);
    } catch (e: unknown) {
      const err = e as ApiError;
      if (err?.status === 401) {
        setErrors(isIt ? "Codice non valido o scaduto." : "Invalid or expired code.");
      } else if (err?.status === 400 && err?.code === "otp_username_mismatch") {
        setErrors(
          isIt
            ? "Lo username non coincide con la richiesta codice (usa lo stesso dello step precedente)."
            : "Username doesn't match the code request (use the same one from the previous step)."
        );
      } else if (err?.status === 422) {
        const fe = getProblemDetailsFieldErrors(err.details);
        setFieldErrors(fe);
        setErrors(isIt ? "Correggi i campi evidenziati." : "Please fix the highlighted fields.");
      } else {
        setErrors(err?.message ?? (isIt ? "Registrazione fallita." : "Register failed."));
      }
    } finally {
      setPending(false);
    }
  }

  async function onResend() {
    setErrors(null);
    setFieldErrors({});
    setInfo(null);
    setPending(true);
    try {
      await requestRegisterOtp({ username, email });
      setInfo(isIt ? "Ti abbiamo inviato un codice via email." : "We sent you a code by email.");
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

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-bold">Create account</h1>
      {step === "request" ? (
        <form onSubmit={onRequestCode} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">Username</label>
            <Input
              name="username"
              required
              maxLength={30}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={pending}
            />
          </div>
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
        </form>
      ) : (
        <form onSubmit={onVerify} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">Username</label>
            <Input name="username" value={username} disabled />
            {fieldErrors.username?.[0] && <p className="text-sm text-destructive">{fieldErrors.username[0]}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <Input name="email" type="email" value={email} disabled />
            {fieldErrors.email?.[0] && <p className="text-sm text-destructive">{fieldErrors.email[0]}</p>}
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
            {fieldErrors.otpCode?.[0] && <p className="text-sm text-destructive">{fieldErrors.otpCode[0]}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm">Password</label>
            <Input
              name="password"
              type="password"
              placeholder={isIt ? "(opzionale)" : "(optional)"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
            />
            {fieldErrors.password?.[0] && <p className="text-sm text-destructive">{fieldErrors.password[0]}</p>}
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
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setStep("request");
              setOtpCode("");
              setPassword("");
              setErrors(null);
              setInfo(null);
              setFieldErrors({});
              setResendAvailableAt(null);
            }}
          >
            {isIt ? "Modifica dati" : "Edit details"}
          </Button>
        </form>
      )}
    </main>
  );
}
