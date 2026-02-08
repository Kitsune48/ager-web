import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticlePublic } from "@/lib/api/articles";
import { Button } from "@/components/ui/button";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: "it" | "en"; id: string }>;
}) {
  const { locale, id } = await params;
  const articleId = Number(id);
  if (!Number.isFinite(articleId)) notFound();

  let article;
  try {
    article = await getArticlePublic(articleId);
  } catch {
    notFound();
  }

  const href = article.canonicalUrl ?? article.url;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="mb-3 text-sm text-muted-foreground">
        <Link href={`/${locale}/search`} className="hover:underline">
          ← {locale === "it" ? "Torna alla ricerca" : "Back to search"}
        </Link>
      </div>

      <h1 className="text-2xl font-semibold leading-snug">{article.title}</h1>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {article.sourceName && <span>{article.sourceName}</span>}
        {article.publishedAt && (
          <>
            {article.sourceName && <span>•</span>}
            <span>{new Date(article.publishedAt).toLocaleString(locale)}</span>
          </>
        )}
      </div>

      {article.imageUrl && (
        <div className="mt-4">
          <Image
            src={article.imageUrl}
            alt=""
            width={1200}
            height={630}
            className="w-full rounded-md object-cover"
          />
        </div>
      )}

      {article.excerpt && (
        <p className="mt-4 text-sm text-muted-foreground">{article.excerpt}</p>
      )}

      <div className="mt-6 flex gap-2">
        <Button asChild>
          <a href={href} target="_blank" rel="noreferrer">
            {locale === "it" ? "Apri articolo" : "Open article"}
          </a>
        </Button>

        <Button asChild variant="outline">
          <a href={href} target="_blank" rel="noreferrer">
            {locale === "it" ? "Copia link" : "Copy link"}
          </a>
        </Button>
      </div>
    </div>
  );
}
