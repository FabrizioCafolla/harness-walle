import type { APIRoute } from "astro";
import config from "@walle/config";
import { getCollection } from "astro:content";

/**
 * /llms.txt — a build-time markdown index of the site for AI crawlers
 * (https://llmstxt.org). Lists the site identity and the page tree with
 * descriptions from content frontmatter.
 *
 * Seed file: owned by the consumer after scaffold — extend the `sections`
 * array with your own page groups.
 */
export const GET: APIRoute = async ({ site }) => {
  const base = (config.app.astro.basePath || "").replace(/\/$/, "");
  const url = (path: string) => new URL(`${base}${path}`, site).href;

  const posts = (await getCollection("posts"))
    .filter((post) => !post.data.draft)
    .sort(
      (a, b) =>
        new Date(b.data.publishDate ?? 0).getTime() - new Date(a.data.publishDate ?? 0).getTime()
    );

  const lines = [
    `# ${config.app.website.title}`,
    "",
    `> ${config.app.website.description}`,
    "",
    "## Pages",
    "",
    `- [Home](${url("/")})`,
    `- [Blog](${url("/blog")})`,
    "",
    "## Blog posts",
    "",
    ...posts.map((post) => {
      const desc = post.data.description ? `: ${post.data.description}` : "";
      return `- [${post.data.title}](${url(`/blog/${post.id}`)})${desc}`;
    }),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
