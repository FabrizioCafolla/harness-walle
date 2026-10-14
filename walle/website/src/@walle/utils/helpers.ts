import { label, locale as siteLocale } from "./i18n";

export function getPlatformIcon(platform: string): string {
  const platform_lc = platform.toLowerCase();
  if (platform_lc.includes("github")) return "fa:github";
  if (platform_lc.includes("gitlab")) return "fa:gitlab";
  if (platform_lc.includes("bitbucket")) return "fa:bitbucket";
  return "fa:code-fork";
}

export function calculateTimeAgo(dateString: string): string | null {
  if (!dateString) return null;
  const creationDate = new Date(dateString);
  const currentDate = new Date();
  const diffTime = currentDate.getTime() - creationDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function formatDate(dateString: string, locale: string = siteLocale()): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function calculateReadingTime(content: string): {
  text: string;
  minutes: number;
  words: number;
} {
  const wordsPerMinute = 200;
  const imageReadingTime = 12; // seconds per image
  const codeReadingTime = 25; // seconds per code block

  const cleanText = content
    .replace(/<[^>]*>/g, "") // Remove HTML
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`[^`]*`/g, "") // Remove inline code
    .replace(/!\[.*?\]\(.*?\)/g, "") // Remove markdown images
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .trim();

  const words = cleanText.split(/\s+/).filter((word) => word.length > 0).length;

  const images = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;
  const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;

  const totalMinutes = Math.ceil(
    words / wordsPerMinute + (images * imageReadingTime) / 60 + (codeBlocks * codeReadingTime) / 60
  );

  const duration = new Intl.NumberFormat(siteLocale(), {
    style: "unit",
    unit: "minute",
    unitDisplay: "long",
  }).format(totalMinutes);
  return {
    text: label("readingTime").replace("{duration}", duration),
    minutes: totalMinutes,
    words: words,
  };
}

function getBasePath(): string {
  return (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
}

export function resolveInternalUrl(url: string): string {
  if (!url) return url;

  const isExternalLike = /^(?:[a-z]+:)?\/\//i.test(url);
  if (
    isExternalLike ||
    url.startsWith("#") ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:")
  ) {
    return url;
  }

  const basePath = getBasePath();

  if (url === "/") {
    return basePath || "/";
  }

  if (url.startsWith("/")) {
    return `${basePath}${url}`;
  }

  return url;
}

export function normalizePath(path: string): string {
  if (!path) return "/";
  if (path === "/") return "/";
  return path.replace(/\/$/, "");
}

/**
 * Meta-description budget. Returns `text` untouched when it fits, otherwise cuts it at the last
 * word boundary that fits and appends an ellipsis.
 *
 * `cut > 0` guards `lastIndexOf(" ", n)` returning -1 (no space in the first n characters, e.g.
 * a URL), where `slice(0, -1)` would drop one character; the cut is then hard at the limit.
 */
export function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.lastIndexOf(" ", maxLength - 1);
  return text.slice(0, cut > 0 ? cut : maxLength - 1).trimEnd() + "…";
}
