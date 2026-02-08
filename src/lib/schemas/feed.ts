import { z } from "zod";
import { ArticleSchema } from "./article";

export const FeedItemSchema = ArticleSchema.extend({
  score: z.number().optional(), // present in feed context
});

export const FeedResponseSchema = z.object({
  items: z.array(FeedItemSchema),
  nextCursor: z.string().nullable().optional(),
});

export type FeedItem = z.infer<typeof FeedItemSchema>;
export type FeedResponse = z.infer<typeof FeedResponseSchema>;
