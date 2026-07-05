import type { CollectionEntry } from "astro:content";

export type PostsEntry = CollectionEntry<"posts">;

export interface Posts {
  title: string;
  description: string;
  author?: string;
  draft?: boolean;
  image?: string;
  publishDate?: Date;
  readingTime?: number;
  slug?: string;
  tags?: string[];
}
