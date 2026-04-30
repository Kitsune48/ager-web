import { getTranslations } from "next-intl/server";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LocaleToggle from "@/components/layout/LocaleToggle";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "layout.header" });

  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      <div className="fixed right-4 top-4 z-50 flex items-center gap-1">
        <LocaleToggle
          labels={{
            language: t("language"),
            italian: t("languageItalian"),
            english: t("languageEnglish"),
          }}
        />
        <ThemeToggle
          labels={{
            theme: t("theme"),
            system: t("themeSystem"),
            light: t("themeLight"),
            dark: t("themeDark"),
          }}
        />
      </div>
      {children}
    </div>
  );
}
