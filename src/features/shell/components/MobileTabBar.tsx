"use client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

export default function MobileTabBar() {
  const { locale } = (useParams() as { locale: "it" | "en" });
  const pathname = usePathname();

  const tabs = [
    { href: `/${locale}/feed`, label: locale === "it" ? "Feed" : "Feed" },
    { href: `/${locale}/lists`, label: locale === "it" ? "Liste" : "Lists" },
    { href: `/${locale}/profile`, label: locale === "it" ? "Profilo" : "Profile" }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t bg-background/90 py-2 backdrop-blur sm:hidden">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={[
              "rounded px-3 py-1.5 text-sm",
              active ? "bg-foreground text-background" : "text-foreground"
            ].join(" ")}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
