"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function AppHeader() {
  const { locale } = (useParams() as { locale: "it" | "en" });

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Link href={`/${locale}/feed`} className="font-semibold">Ager</Link>

        <nav className="ml-2 hidden items-center gap-4 sm:flex">
          <Link className="text-sm hover:underline" href={`/${locale}/feed`}>
            {locale === "it" ? "Feed" : "Feed"}
          </Link>
          <Link className="text-sm hover:underline" href={`/${locale}/lists`}>
            {locale === "it" ? "Liste" : "Lists"}
          </Link>
          <Link className="text-sm hover:underline" href={`/${locale}/profile`}>
            {locale === "it" ? "Profilo" : "Profile"}
          </Link>
        </nav>

        <div className="ml-auto">{/* auth / avatar etc. */}</div>
      </div>
    </header>
  );
}
