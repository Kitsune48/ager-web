import { z } from "zod";

export const ArticleSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  title: z.string(),
  excerpt: z.string().nullable().optional(),
  content: z.string().optional(), // detail page may include this
  author: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  topics: z.array(z.string()).nullable().optional(),
  lang: z.string().min(2).max(10),
  publishedAt: z.string(), // ISO
  createdAt: z.string(),   // ISO
});

export type Article = z.infer<typeof ArticleSchema>;
