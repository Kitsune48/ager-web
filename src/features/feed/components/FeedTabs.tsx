"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

type TabKey = "latest" | "top" | "following";

export default function FeedTabs() {
  const { locale } = (useParams() as { locale: "it" | "en" });
  const search = useSearchParams();
  const active = (search.get("tab") as TabKey) ?? "latest";
  const t = useTranslations("feed.tabs");

  const order: TabKey[] = ["latest", "top", "following"];

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {order.map((key) => {
        const href = `/${locale}/feed?tab=${key}`;
        const selected = key === active;
        return (
          <Link
            key={key}
            href={href}
            aria-current={selected ? "page" : undefined}
            className={[
              "rounded-full text-sm transition-colors",
              "px-3 py-1.5",
              selected
                ? "bg-foreground text-background"
                : "bg-muted text-foreground hover:bg-muted/80",
            ].join(" ")}
          >
            {t(key)}
          </Link>
        );
      })}
    </div>
  );
}
