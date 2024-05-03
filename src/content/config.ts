import { defineCollection, z } from "astro:content";

const booksCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    author: z.string(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = {
  books: booksCollection,
};
