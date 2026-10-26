// Layout Props live in a plain .ts module so bare `tsc` can check them: `.astro` frontmatter
// types resolve only through Astro's TypeScript plugin.
import type { CollectionEntry } from "astro:content";

export interface AbstractLayoutProps {
  /** Document `<title>`. @default "" */
  headerTitle?: string;
  /** Meta description. @default config.app.website.description */
  headerDescription?: string;
  /** Open Graph / social preview image URL. @default config.app.website.image */
  headerImage?: string | null;
  /** Open Graph image, when different from `headerImage`. */
  headerOgImage?: string | null;
  /** A layout's own per-entry OG image, e.g. `ogImageUrl("posts", id)` from
   * BlogPostLayout. Lower priority than `headerOgImage`, higher than the site default. */
  headerEntryOgImage?: string | null;
  /** Meta robots directive. @default config.app.website.robots */
  headerRobots?: string;
  /** Document `lang` attribute. @default the page's `i18n` language, else config.app.website.language */
  headerLanguage?: string;
  /** Language codes in which this page exists (itself included), for `<link rel="alternate" hreflang>`.
   * Needs `i18n`; fewer than two emit nothing. */
  headerTranslations?: string[];
  /** Article `published_time`, for pages with one (blog posts). */
  headerPublishedTime?: string | Date | null;
  /** Accessible label of the skip-to-content link. @default "Skip to content" */
  skipLinkLabel?: string;
}

export type BaseLayoutProps = AbstractLayoutProps;

export interface BlogPostLayoutProps extends BaseLayoutProps {
  title: string;
  description: string;
  author?: string;
  publishDate?: Date;
  readingTime?: string;
  image?: string | null;
  tags?: string[];
  draft?: boolean;
  /** The `posts` collection entry id, for deriving its own OG image when enabled. */
  id?: string;
}

export interface BlogPostsLayoutProps extends BaseLayoutProps {
  /** Posts to list, bypassing the collection query below. */
  posts?: CollectionEntry<"posts">[];
  /** Content collection to query when `posts` is not given. @default "posts" */
  postsCollection?: string;
  /** Only list posts carrying at least one of these tags. */
  filterTags?: string[];
  /** Show the tag/search filter bar above the list. @default true */
  showFilters?: boolean;
}

export interface DetailLayoutProps extends BaseLayoutProps {
  /** Page title (header + document title) */
  title: string;
  /** Meta description */
  description?: string;
  /** Open Graph image URL */
  ogImage?: string;
  /** Breadcrumb trail (last item should be the current page) */
  breadcrumbs?: { label: string; href?: string; icon?: string }[];
  /** Optional back link above the breadcrumbs */
  backLink?: {
    href: string;
    /** @default "Back" */
    label?: string;
  };
  /**
   * Product rendered by this page, for JSON-LD. Shaped like `ProductCard`'s `ProductData`,
   * which lives in ProductCard.astro frontmatter and is unreachable from a `.ts` module.
   */
  product?: Record<string, unknown>;
  /**
   * Alignment of the badges row inside the header.
   * @default "start"
   */
  badgesAlign?: "start" | "center" | "end";
}
