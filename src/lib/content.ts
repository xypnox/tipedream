import { getCollection } from "astro:content";

export const allBooks = async () => await getCollection('books');
