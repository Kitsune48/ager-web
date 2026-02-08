"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import {
  getMyReadingListsPage,
  getReadingListItemsPage,
  createReadingList,
  addItemToReadingList,
  removeItemFromReadingList,
  deleteReadingList,
  type ReadingListPage,
  type ReadingListItemsPage,
} from "@/lib/api/readingLists";
import type { ReadingListItem, ReadingList } from "@/lib/api/types";

/**
 * Non-paged lists, used e.g. in AddToListDialog.
 * (Internally we just fetch one big page.)
 */
export function useMyLists() {
  const { accessToken } = useSession();

  return useQuery<ReadingList[]>({
    queryKey: ["lists", "all"],
    enabled: !!accessToken,
    queryFn: async () => {
      if (!accessToken) return [];
      const page = await getMyReadingListsPage(accessToken, null, 100);
      return page.items;
    },
  });
}

/**
 * Paged lists for the Lists index page.
 *
 * Keeps the same signature: useMyListsInfinite(limit = 20)
 */
export function useMyListsInfinite(limit = 20) {
  const { accessToken } = useSession();

  return useInfiniteQuery<ReadingListPage, Error>({
    queryKey: ["lists", "mine", limit],
    enabled: !!accessToken,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      if (!accessToken) {
        return { items: [], nextCursor: null };
      }
      return getMyReadingListsPage(
        accessToken,
        (pageParam as string | null) ?? null,
        limit
      );
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/**
 * Simple non-paged items (if you need it somewhere else).
 * (Internally: first page with big limit.)
 */
export function useListItems(listId: number) {
  const { accessToken } = useSession();

  return useQuery<ReadingListItem[]>({
    queryKey: ["lists", listId, "items", "single"],
    enabled: !!accessToken && !!listId,
    queryFn: async () => {
      if (!accessToken) return [];
      const page = await getReadingListItemsPage(
        listId,
        accessToken,
        null,
        100
      );
      return page.items;
    },
  });
}

/**
 * Paged items for the list detail page.
 *
 * Keeps the same signature: useListItemsInfinite(listId, limit = 20)
 */
export function useListItemsInfinite(listId: number, limit = 20) {
  const { accessToken } = useSession();

  return useInfiniteQuery<ReadingListItemsPage, Error>({
    queryKey: ["lists", listId, "items"],
    enabled: !!accessToken && !!listId,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      if (!accessToken) {
        return { items: [], nextCursor: null };
      }
      return getReadingListItemsPage(
        listId,
        accessToken,
        (pageParam as string | null) ?? null,
        limit
      );
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/**
 * Create a new list.
 *
 * Old signature: body { name, description?, isPublic? }
 * We now map isPublic → visibility ("Public"/"Private").
 */
export function useCreateList() {
  const { accessToken } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      name: string;
      description?: string | null;
      isPublic?: boolean;
    }) => {
      if (!accessToken) throw new Error("Not authenticated");

      // 0 = Private, 2 = Public
      const visibility: 0 | 2 = body.isPublic ? 2 : 0;

      return createReadingList(
        {
          name: body.name,
          description: body.description ?? undefined,
          visibility,
          allowCollaboration: false,
        },
        accessToken
      );
    },
    // ...
  });
}

/**
 * Add an article to a list.
 */
export function useAddToList() {
  const { accessToken } = useSession();
  const qc = useQueryClient();

  return useMutation({
    // Now we accept readingListId + articleId + optional note
    mutationFn: async (args: {
      readingListId: number;
      articleId: number;
      note?: string;
    }) => {
      if (!accessToken) throw new Error("Not authenticated");
      await addItemToReadingList(
        args.readingListId,
        {
          articleId: args.articleId,
          note: args.note,
        },
        accessToken
      );
    },
    onSuccess: (_data, vars) => {
      // refresh that list’s items + list summaries
      qc.invalidateQueries({ queryKey: ["lists", vars.readingListId, "items"] });
      qc.invalidateQueries({ queryKey: ["lists"] });
      qc.invalidateQueries({ queryKey: ["lists", "all"] });
    },
  });
}

/**
 * Remove an article from a list (by articleId).
 */
export function useRemoveFromList(readingListId: number) {
  const { accessToken } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (articleId: number) => {
      if (!accessToken) throw new Error("Not authenticated");
      await removeItemFromReadingList(readingListId, articleId, accessToken);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lists", readingListId, "items"] });
      qc.invalidateQueries({ queryKey: ["lists"] });
      qc.invalidateQueries({ queryKey: ["lists", "all"] });
    },
  });
}

/**
 * Delete a whole list.
 */
export function useDeleteList() {
  const { accessToken } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (listId: number) => {
      if (!accessToken) throw new Error("Not authenticated");
      await deleteReadingList(listId, accessToken);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lists"] });
      qc.invalidateQueries({ queryKey: ["lists", "all"] });
    },
  });
}
