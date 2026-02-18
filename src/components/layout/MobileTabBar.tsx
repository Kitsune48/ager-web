"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Home, ListChecks, Search, User } from "lucide-react";

export default function MobileTabBar() {
  const pathname = usePathname();
  const params = useParams() as { locale?: string };
  const locale = params?.locale ?? "it";
  const isIt = locale === "it";

  const items = [
    { path: "/feed", label: isIt ? "Feed" : "Feed", Icon: Home },
    { path: "/explore", label: isIt ? "Esplora" : "Explore", Icon: Search },
    { path: "/lists", label: isIt ? "Liste" : "Lists", Icon: ListChecks },
    { path: "/profile", label: isIt ? "Profilo" : "Profile", Icon: User },
  ];

  return (
    <nav aria-label="Primary" className="grid grid-cols-4">
      {items.map(({ path, label, Icon }) => {
        const href = `/${locale}${path}`;
        const active = pathname === href || pathname?.startsWith(href + "/");
        return (
          <Link
            key={path}
            href={href}
            className="flex flex-col items-center justify-center gap-1 py-3 text-sm"
            aria-current={active ? "page" : undefined}
          >
            <Icon className={`h-5 w-5 ${active ? "text-foreground" : "text-muted-foreground"}`} />
            <span className={active ? "text-foreground" : "text-muted-foreground"}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
