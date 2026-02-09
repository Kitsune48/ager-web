"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  locale: "it" | "en";
  href: string;
};

async function copyToClipboard(text: string) {
  const nav = typeof window !== "undefined" ? window.navigator : undefined;

  if (nav?.clipboard?.writeText) {
    await nav.clipboard.writeText(text);
    return;
  }

  // Fallback for older browsers
  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

export default function ArticleActions({ locale, href }: Props) {
  const isIt = locale === "it";

  return (
    <div className="mt-6 flex gap-2">
      <Button asChild>
        <a href={href} target="_blank" rel="noreferrer">
          {isIt ? "Apri articolo" : "Open article"}
        </a>
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            await copyToClipboard(href);
            toast(isIt ? "Link copiato" : "Link copied");
          } catch {
            toast(isIt ? "Impossibile copiare il link" : "Unable to copy link");
          }
        }}
      >
        {isIt ? "Copia link" : "Copy link"}
      </Button>
    </div>
  );
}
