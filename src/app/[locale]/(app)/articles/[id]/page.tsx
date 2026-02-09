import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticlePublic } from "@/lib/api/articles";
import ArticleActions from "./ArticleActions";

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
  const rawLang = (article.lang ?? "").trim();
  const primaryLang = rawLang ? rawLang.split(/[-_]/)[0].toLowerCase() : "";
  const languageLabel =
    primaryLang === "it"
      ? locale === "it"
        ? "Italiano"
        : "Italian"
      : primaryLang === "en"
        ? locale === "it"
          ? "Inglese"
          : "English"
        : rawLang
          ? rawLang.toUpperCase()
          : null;

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

        {languageLabel && (
          <>
            {(article.sourceName || article.publishedAt) && <span>•</span>}
            <span>
              {locale === "it" ? "Lingua" : "Language"}: {languageLabel}
            </span>
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

      <ArticleActions locale={locale} href={href} />
    </div>
  );
}
