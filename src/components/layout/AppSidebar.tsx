"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function AppSidebar() {
  const params = useParams() as { locale?: "it" | "en" };
  const locale = params?.locale ?? "it";
  const isIt = locale === "it";

  const links = [
    { path: "/feed", label: isIt ? "Per te" : "For you" },
    { path: "/feed?tab=latest", label: isIt ? "Ultimi" : "Latest" },
    { path: "/feed?tab=top", label: "Top" },
    { path: "/explore", label: isIt ? "Esplora" : "Explore" },
    { path: "/lists", label: isIt ? "Liste" : "Reading lists" }
  ];

  return (
    <nav aria-label="Sections" className="sticky top-[4.25rem]">
      <ul className="space-y-1">
        {links.map(({ path, label }) => (
          <li key={path}>
            <Link
              href={`/${locale}${path}`}
              className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
