"use client";

import { useTranslations } from "next-intl";

export default function Home() {
  const tApp = useTranslations("app");   // namespace = "app"
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">{tApp("title")}</h1>
      <p className="text-muted-foreground mt-2">
        Welcome! We'll build the Feed next.
      </p>
    </main>
  );
}
