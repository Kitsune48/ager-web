"use client";

import { useQuery } from "@tanstack/react-query";
import { searchArticles } from "@/lib/api/articlesSearch";
import { useSession } from "@/lib/auth/session";

export function useArticleSearch(q: string, page: number, pageSize: number) {
  const { accessToken } = useSession();

  return useQuery({
    queryKey: ["articleSearch", q, page, pageSize],
    queryFn: () => searchArticles({ q, page, pageSize, accessToken: accessToken || undefined }),
    enabled: q.trim().length > 0, // no request for empty query
    staleTime: 30_000,
    retry: 1,
  });
}
