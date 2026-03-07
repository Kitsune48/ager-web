import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhilosophyPage } from "@/features/philosophy/components/PhilosophyPage";
import { philosophyContent, type PhilosophyLang } from "@/features/philosophy/philosophyContent";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const lang = locale === "en" || locale === "it" ? locale : "it";
  const meta = philosophyContent[lang].meta;

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${lang}/philosophy`,
      languages: {
        it: "/it/philosophy",
        en: "/en/philosophy",
        "x-default": "/it/philosophy",
      },
    },
    openGraph: {
      type: "article",
      title: meta.title,
      description: meta.description,
      url: `${siteUrl}/${lang}/philosophy`,
      locale: lang,
      siteName: "Ager",
    },
  };
}

export default async function LocalizedPhilosophyPage({ params }: PageProps) {
  const { locale } = await params;

  if (locale !== "it" && locale !== "en") {
    notFound();
  }

  const lang = locale as PhilosophyLang;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: philosophyContent[lang].meta.title,
    description: philosophyContent[lang].meta.description,
    url: `${siteUrl}/${lang}/philosophy`,
    inLanguage: lang,
    isPartOf: {
      "@type": "WebSite",
      name: "Ager",
      url: siteUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PhilosophyPage locale={lang} content={philosophyContent[lang]} />
    </>
  );
}
