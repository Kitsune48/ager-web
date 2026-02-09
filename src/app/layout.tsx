import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ager",
  description: "Your personalized news & knowledge feed",
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
