"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export type TagBarTag = {
  slug: string;
  name: string;
};

export default function TagBar(props: {
  locale: "it" | "en";
  tags: TagBarTag[];
  selectedTag: string | null;
  hrefForTag: (slug: string | null) => string;
  loading?: boolean;
  showFallbackNote?: boolean;
}) {
  const { locale, tags, selectedTag, hrefForTag, loading, showFallbackNote } = props;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {locale === "it" ? "Tag" : "Tags"}
        </div>
        {loading ? (
          <div className="text-xs text-muted-foreground">
            {locale === "it" ? "Caricamento…" : "Loading…"}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge asChild variant={selectedTag === null ? "default" : "secondary"} className="rounded-full">
          <Link href={hrefForTag(null)} aria-current={selectedTag === null ? "page" : undefined}>
            {locale === "it" ? "Tutti" : "All"}
          </Link>
        </Badge>

        {tags.map((t) => {
          const selected = selectedTag === t.slug;
          return (
            <Badge
              key={t.slug}
              asChild
              variant={selected ? "default" : "secondary"}
              className="rounded-full"
            >
              <Link href={hrefForTag(t.slug)} aria-current={selected ? "page" : undefined}>
                {t.name}
              </Link>
            </Badge>
          );
        })}
      </div>

      {showFallbackNote ? (
        <div className="mt-2 text-xs text-muted-foreground">
          {locale === "it"
            ? "Impossibile caricare i tag dal server: mostro un set minimo."
            : "Could not load tags from server: showing a minimal set."}
        </div>
      ) : null}
    </div>
  );
}
