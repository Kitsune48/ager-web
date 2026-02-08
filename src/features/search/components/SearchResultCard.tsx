"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";

type Props = {
  articleId: number;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  sourceName: string;
  publishedAt: string;
};

function timeAgo(iso: string, locale: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (mins < 1) return rtf.format(0, "minute");
  if (mins < 60) return rtf.format(-mins, "minute");
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return rtf.format(-hrs, "hour");
  const days = Math.floor(hrs / 24);
  return rtf.format(-days, "day");
}

export default function SearchResultCard(props: Props) {
  const { locale } = useParams() as { locale: string };
  const rel = timeAgo(props.publishedAt, locale ?? "it");

  const hasImage = !!props.imageUrl;

  return (
    <Card className={["grid gap-4 p-4", hasImage ? "sm:grid-cols-[1fr,220px]" : ""].join(" ")}>
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="rounded-full">
            {props.sourceName}
          </Badge>
          <span>•</span>
          <span>{rel}</span>
        </div>

        <Link
          href={`/${locale}/articles/${props.articleId}`}
          className="block text-base font-semibold leading-snug hover:underline"
        >
          {props.title}
        </Link>

        {props.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {props.excerpt}
          </p>
        )}
      </div>

      {hasImage && (
        <div className="w-full">
          <Image
            src={props.imageUrl!}
            alt=""
            width={800}
            height={450}
            className="h-40 w-full rounded-md object-contain bg-muted sm:h-28"
            sizes="(max-width: 640px) 100vw, 220px"
          />
        </div>
      )}
    </Card>
  );
}
