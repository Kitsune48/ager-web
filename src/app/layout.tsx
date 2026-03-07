import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ager",
    template: "%s | Ager",
  },
  description: "Your personalized news & knowledge feed",
  applicationName: "Ager",
  alternates: {
    canonical: "/it",
    languages: {
      it: "/it",
      en: "/en",
      "x-default": "/it",
    },
  },
  openGraph: {
    type: "website",
    siteName: "Ager",
    title: "Ager",
    description: "Your personalized news & knowledge feed",
    url: siteUrl,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Default to Italian at the root. (Locale-specific content will still come from [locale] layout.)
  return (
    <html lang="it" suppressHydrationWarning>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
