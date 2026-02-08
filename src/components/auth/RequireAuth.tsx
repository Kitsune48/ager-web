"use client";

import { useSession } from "@/lib/auth/session";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { accessToken } = useSession();
  const router = useRouter();
  const { locale } = (useParams() as { locale: string });
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // On first mount, decide immediately
    if (!accessToken) {
      router.replace(`/${locale}/login`);
    } else {
      setChecked(true);
    }
  }, [accessToken, locale, router]);

  // Prevent UI flash while deciding
  if (!checked) return null;
  return <>{children}</>;
}
