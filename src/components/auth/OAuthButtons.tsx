"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthActions } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";

declare global {
  interface Window {
    google?: any;
    AppleID?: any;
  }
}

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") return resolve();

    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.getAttribute("data-loaded") === "true") return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => {
      script.setAttribute("data-loaded", "true");
      resolve();
    });
    script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
    document.head.appendChild(script);
  });
}

export default function OAuthButtons({ disabled }: { disabled?: boolean }) {
  const { locale } = useParams() as { locale: "it" | "en" };
  const isIt = locale === "it";
  const router = useRouter();
  const { oauthGoogle, oauthApple } = useAuthActions();

  const [pending, setPending] = useState<"google" | "apple" | null>(null);
  const [actionableError, setActionableError] = useState<{ provider: "Google" | "Apple" } | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const googleInitialized = useRef(false);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  const appleRedirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI;
  const enableApple = process.env.NEXT_PUBLIC_ENABLE_APPLE_AUTH === "true";

  const showGoogle = !!googleClientId;
  const showApple = enableApple && !!appleClientId && !!appleRedirectUri;

  if (!showGoogle && !showApple) return null;

  useEffect(() => {
    // Preload Google script to reduce latency.
    if (!showGoogle) return;
    loadScriptOnce("https://accounts.google.com/gsi/client")
      .then(() => setGoogleReady(true))
      .catch(() => {
        setGoogleReady(false);
      });
  }, [showGoogle, googleClientId]);

  function handleOAuthError(provider: "Google" | "Apple", e: unknown) {
    const err = e as ApiError;
    if (err?.code === "external_auth_email_missing") {
      setActionableError({ provider });
      return;
    }

    const msg = err?.message ?? (isIt ? "Accesso non riuscito." : "Sign-in failed.");
    toast(isIt ? "Errore" : "Error", { description: msg });
  }

  async function startGoogle() {
    setActionableError(null);
    if (!showGoogle || !googleClientId) {
      toast(isIt ? "Google non configurato" : "Google is not configured", {
        description: isIt ? "Imposta NEXT_PUBLIC_GOOGLE_CLIENT_ID" : "Set NEXT_PUBLIC_GOOGLE_CLIENT_ID",
      });
      return;
    }

    try {
      setPending("google");
      await loadScriptOnce("https://accounts.google.com/gsi/client");

      const g = window.google;
      if (!g?.accounts?.id) {
        toast(isIt ? "Google non disponibile" : "Google unavailable");
        return;
      }

      if (!googleInitialized.current) {
        g.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (resp: any) => {
            const idToken = resp?.credential;
            if (!idToken) {
              toast(isIt ? "Token Google mancante" : "Missing Google token");
              setPending(null);
              return;
            }

            try {
              await oauthGoogle(idToken);
              router.push(`/${locale}/feed`);
            } catch (e: unknown) {
              handleOAuthError("Google", e);
            } finally {
              setPending(null);
            }
          },
        });
        googleInitialized.current = true;
      }

      // Show One Tap / prompt flow.
      g.accounts.id.prompt();
    } catch {
      toast(isIt ? "Impossibile avviare Google" : "Unable to start Google sign-in");
    } finally {
      setPending(null);
    }
  }

  async function startApple() {
    setActionableError(null);
    if (!showApple) return;
    if (!appleClientId || !appleRedirectUri) {
      toast(isIt ? "Apple non configurato" : "Apple is not configured", {
        description: isIt
          ? "Imposta NEXT_PUBLIC_APPLE_CLIENT_ID e NEXT_PUBLIC_APPLE_REDIRECT_URI"
          : "Set NEXT_PUBLIC_APPLE_CLIENT_ID and NEXT_PUBLIC_APPLE_REDIRECT_URI",
      });
      return;
    }

    try {
      setPending("apple");
      await loadScriptOnce(
        "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
      );

      const A = window.AppleID;
      if (!A?.auth) {
        toast(isIt ? "Apple non disponibile" : "Apple unavailable");
        return;
      }

      A.auth.init({
        clientId: appleClientId,
        scope: "name email",
        redirectURI: appleRedirectUri,
        usePopup: true,
      });

      const resp = await A.auth.signIn();
      const idToken = resp?.authorization?.id_token;

      if (!idToken) {
        toast(isIt ? "Token Apple mancante" : "Missing Apple token");
        return;
      }

      await oauthApple(idToken);
      router.push(`/${locale}/feed`);
    } catch (e: unknown) {
      handleOAuthError("Apple", e);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-2">
      {showGoogle && (
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={startGoogle}
          disabled={disabled || pending !== null || (!googleReady && !!googleClientId)}
        >
          {pending === "google"
            ? isIt
              ? "Accesso con Google…"
              : "Signing in with Google…"
            : isIt
              ? "Continua con Google"
              : "Continue with Google"}
        </Button>
      )}

      {showApple && (
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={startApple}
          disabled={disabled || pending !== null}
        >
          {pending === "apple"
            ? isIt
              ? "Accesso con Apple…"
              : "Signing in with Apple…"
            : isIt
              ? "Continua con Apple"
              : "Continue with Apple"}
        </Button>
      )}

      {actionableError && (
        <div className="rounded-md border p-3 text-sm">
          <div className="text-foreground">
            {isIt
              ? `${actionableError.provider} non ha condiviso la tua email. Per continuare, accedi con OTP via email.`
              : `${actionableError.provider} didn’t share your email. To continue, sign in with an email OTP.`}
          </div>
          <div className="mt-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setActionableError(null);
                router.push(`/${locale}/login?fallback=external_auth_email_missing`);
              }}
            >
              {isIt ? "Accedi con OTP via email" : "Sign in with email code"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
