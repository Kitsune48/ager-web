"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

type TopicKey = "all" | "tech" | "business" | "design" | "ai";

export default function TopicChips() {
  const { locale } = (useParams() as { locale: "it" | "en" });
  const search = useSearchParams();
  const tab = search.get("tab") ?? "latest";
  const topic = (search.get("topic") as TopicKey) ?? "all";
  const t = useTranslations("feed.topics");

  const order: TopicKey[] = ["all", "tech", "business", "design", "ai"];

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-3">
      {order.map((key) => {
        const selected = key === topic;

        const href =
          key === "all"
            ? `/${locale}/feed?tab=${tab}&topic=${key}`
            : `/${locale}/search?tag=${encodeURIComponent(key)}&page=1&pageSize=20`;
        return (
          <Link
            key={key}
            href={href}
            className={[
              "rounded-full text-xs sm:text-sm",
              "px-3 py-1.5",
              selected
                ? "bg-foreground text-background"
                : "bg-muted text-foreground hover:bg-muted/80",
            ].join(" ")}
            aria-current={selected ? "page" : undefined}
          >
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
