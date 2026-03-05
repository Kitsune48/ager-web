import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhilosophyPage } from "@/features/philosophy/components/PhilosophyPage";
import { philosophyContent, type PhilosophyLang } from "@/features/philosophy/philosophyContent";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const lang = locale === "en" || locale === "it" ? locale : "it";
  const meta = philosophyContent[lang].meta;

  return {
    title: meta.title,
    description: meta.description
  };
}

export default async function LocalizedPhilosophyPage({ params }: PageProps) {
  const { locale } = await params;

  if (locale !== "it" && locale !== "en") {
    notFound();
  }

  const lang = locale as PhilosophyLang;

  return <PhilosophyPage locale={lang} content={philosophyContent[lang]} />;
}
