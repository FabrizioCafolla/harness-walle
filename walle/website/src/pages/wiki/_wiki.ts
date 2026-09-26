// Wiki helpers shared by the /wiki index and page routes. Pure functions over collection ids so
// they are unit-testable; the underscore keeps this file out of Astro's routing.

export const SECTIONS = [
  { id: "get-started", title: "Get Started" },
  { id: "develop", title: "Develop" },
  { id: "architecture", title: "Architecture" },
  { id: "ai", title: "AI" },
] as const;

export const REPO_BLOB = "https://github.com/FabrizioCafolla/harness-walle/blob/main";

export interface WikiEntryLike {
  id: string;
  body?: string;
  data?: { title?: string; order?: number };
}

export interface WikiPage {
  id: string;
  title: string;
  order: number;
  section: string | null;
}

/** Frontmatter `title`, else the first H1, else the id. */
export function titleOf(entry: WikiEntryLike): string {
  return (entry.data?.title ?? entry.body?.match(/^#\s+(.+)$/m)?.[1] ?? entry.id).trim();
}

/** The section is the first directory of the id; top-level pages have none. */
export function sectionOf(id: string): string | null {
  const [first, ...rest] = id.split("/");
  return rest.length > 0 && SECTIONS.some((s) => s.id === first) ? first : null;
}

export function toPage(entry: WikiEntryLike): WikiPage {
  return {
    id: entry.id,
    title: titleOf(entry),
    order: entry.data?.order ?? Number.MAX_SAFE_INTEGER,
    section: sectionOf(entry.id),
  };
}

/** Top-level pages first as "Overview", then the sections in order; `order`, then title, inside. */
export function groupPages(entries: WikiEntryLike[]) {
  const pages = entries.map(toPage);
  const byOrder = (a: WikiPage, b: WikiPage) => a.order - b.order || a.title.localeCompare(b.title);
  return [{ id: "overview", title: "Overview" }, ...SECTIONS]
    .map((section) => ({
      ...section,
      pages: pages.filter((p) => (p.section ?? "overview") === section.id).sort(byOrder),
    }))
    .filter((group) => group.pages.length > 0);
}

/**
 * Resolves a relative markdown link from the page `fromId` (e.g. "architecture/pwa") against the
 * wiki tree. Returns the target wiki id, a repo-root path when the link leaves the wiki folder,
 * or null for anything that is not a relative `.md` link.
 */
export function resolveLink(
  fromId: string,
  href: string
):
  { kind: "wiki"; id: string; hash: string } | { kind: "repo"; path: string; hash: string } | null {
  const match = href.match(/^([^#?]+\.md)(#.*)?$/i);
  if (!match || /^[a-z]+:|^\//i.test(href)) return null;
  const [, file, hash = ""] = match;
  const parts = fromId.split("/").slice(0, -1);
  let depthAboveWiki = 0;
  for (const segment of file.split("/")) {
    if (segment === "." || segment === "") continue;
    if (segment === "..") {
      if (parts.length > 0) parts.pop();
      else depthAboveWiki++;
    } else parts.push(segment);
  }
  const target = parts.join("/").replace(/\.md$/i, "");
  if (depthAboveWiki > 0) return { kind: "repo", path: `${target}.md`, hash };
  return { kind: "wiki", id: target.toLowerCase() === "readme" ? "readme" : target, hash };
}

/** Rewrites relative `.md` links in rendered HTML to /wiki routes or GitHub repo files. */
export function rewriteLinks(html: string, fromId: string, wikiIds: Set<string>, base: string) {
  return html.replace(/href="([^"]+)"/g, (whole, href: string) => {
    const link = resolveLink(fromId, href);
    if (!link) return whole;
    if (link.kind === "repo") return `href="${REPO_BLOB}/${link.path}${link.hash}"`;
    return wikiIds.has(link.id) ? `href="${base}/wiki/${link.id}${link.hash}"` : whole;
  });
}
