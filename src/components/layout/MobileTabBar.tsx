"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Home, ListChecks, User } from "lucide-react";

const items = [
  { path: "/feed", label: "Feed", Icon: Home },
  { path: "/lists", label: "Lists", Icon: ListChecks },
  { path: "/profile", label: "Profile", Icon: User }
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const params = useParams() as { locale?: string };
  const locale = params?.locale ?? "it";

  return (
    <nav aria-label="Primary" className="grid grid-cols-3">
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
