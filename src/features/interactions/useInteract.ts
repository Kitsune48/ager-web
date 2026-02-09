"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useRef } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";
import { useSession } from "@/lib/auth/session";
import { postInteraction, type InteractionKind } from "@/lib/api/interactions";
import type { FeedPage } from "@/lib/api/types";

/** Type guard for TanStack Infinite Query cached data */
function isInfiniteData<T>(data: unknown): data is InfiniteData<T> {
  return !!data && typeof data === "object" && "pages" in (data as any) && Array.isArray((data as any).pages);
}

/**
 * Optimistic interactions with Undo (3s window):
 * - LIKE/SAVE: schedule server write in 3s (Undo cancels)
 * - DISCARD: remove from cache instantly, schedule write in 3s (Undo restores)
 * - REPORT: immediate write
 */
export function useInteract() {
  const { locale } = useParams() as { locale?: "it" | "en" };
  const isIt = locale !== "en";

  const { accessToken } = useSession();
  const qc = useQueryClient();
  const timers = useRef<Map<string, number>>(new Map());

  function requireAuth(): boolean {
    if (accessToken) return true;
    toast(isIt ? "Accedi per continuare" : "Sign in to continue", {
      description: isIt
        ? "Devi essere autenticato per usare questa azione."
        : "You need to be signed in to use this action.",
    });
    return false;
  }

  function delayCommit(articleId: number, fn: () => void) {
    const key = String(articleId);
    const existing = timers.current.get(key);
    if (existing) clearTimeout(existing);
    const id = window.setTimeout(() => {
      timers.current.delete(key);
      fn();
    }, 3000);
    timers.current.set(key, id);
  }

  const commit = useMutation({
    mutationFn: (args: { articleId: number; type: InteractionKind; reason?: string }) =>
      postInteraction(args, accessToken || undefined),
    onSuccess: (_data, vars) => {
      analytics.track("interaction", vars);
      // Reconcile with server truth silently
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  function cancel(articleId: number) {
    const key = String(articleId);
    const id = timers.current.get(key);
    if (id) {
      clearTimeout(id);
      timers.current.delete(key);
      return true;
    }
    return false;
  }

  function like(articleId: number) {
    if (!requireAuth()) return;
    delayCommit(articleId, () => commit.mutate({ articleId, type: "LIKE" }));
    toast(isIt ? "Mi piace" : "Like", {
      description: isIt ? "Azione programmata. Annulla?" : "Action scheduled. Undo?",
      action: {
        label: isIt ? "Annulla" : "Undo",
        onClick: () => {
          if (cancel(articleId)) analytics.track("interaction.undo", { articleId, type: "LIKE" });
        },
      },
    });
    analytics.track("interaction.optimistic", { articleId, type: "LIKE" });
  }

  function save(articleId: number) {
    if (!requireAuth()) return;
    delayCommit(articleId, () => commit.mutate({ articleId, type: "SAVE" }));
    toast(isIt ? "Salvato" : "Saved", {
      description: isIt ? "Azione programmata. Annulla?" : "Action scheduled. Undo?",
      action: {
        label: isIt ? "Annulla" : "Undo",
        onClick: () => {
          if (cancel(articleId)) analytics.track("interaction.undo", { articleId, type: "SAVE" });
        },
      },
    });
    analytics.track("interaction.optimistic", { articleId, type: "SAVE" });
  }

  function hide(articleId: number) {
    if (!requireAuth()) return;
    // Take snapshots of all feed-related caches (for Undo)
    const snapshots: Array<{ key: unknown[]; data: unknown }> = [];
    const queries = qc.getQueriesData({ queryKey: ["feed"] });

    for (const [key, data] of queries) {
      snapshots.push({ key: key as unknown[], data });

      if (!data) continue;

      // Case 1: Infinite data => { pages: FeedPage[]; pageParams: [...] }
      if (isInfiniteData<FeedPage>(data)) {
        const newPages = data.pages.map((p) => ({
          ...p,
          items: (p.items ?? []).filter((it) => it.articleId !== articleId),
        }));
        qc.setQueryData(key, { ...data, pages: newPages });
        continue;
      }

      // Case 2: Single page shape => { items: FeedItem[] }
      if ((data as FeedPage).items) {
        const page = data as FeedPage;
        qc.setQueryData(key, {
          ...page,
          items: (page.items ?? []).filter((it) => it.articleId !== articleId),
        });
        continue;
      }

      // Unknown shape: ignore
    }

    // Schedule server commit in 3s
    delayCommit(articleId, () => commit.mutate({ articleId, type: "DISCARD" }));

    toast(isIt ? "Articolo nascosto" : "Article hidden", {
      description: isIt
        ? "Annulla per ripristinare l'articolo"
        : "Undo to restore the article",
      action: {
        label: isIt ? "Annulla" : "Undo",
        onClick: () => {
          // Cancel pending commit and restore snapshots
          if (cancel(articleId)) {
            for (const snap of snapshots) {
              qc.setQueryData(snap.key, snap.data);
            }
            analytics.track("interaction.undo", { articleId, type: "DISCARD" });
          }
        },
      },
    });

    analytics.track("interaction.optimistic", { articleId, type: "DISCARD" });
  }

  function report(articleId: number, reason?: string) {
    if (!requireAuth()) return;
    commit.mutate({ articleId, type: "REPORT", reason });
    toast(isIt ? "Segnalato" : "Reported", {
      description: isIt ? "Grazie per la tua segnalazione." : "Thanks for your report.",
    });
  }

  return { like, save, hide, report, isPending: commit.isPending };
}
