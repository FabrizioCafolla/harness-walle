import type { APIRoute } from "astro";
import config from "@walle/config";
import { getCollection } from "astro:content";

/**
 * /llms.txt (https://llmstxt.org): a build-time markdown index of the site for AI
 * crawlers. Lists the site identity and the page tree with descriptions from content.
 *
 * Seed file: owned by the consumer after scaffold. Extend the `lines` array with your
 * own page groups.
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

  const products = await getCollection("products");

  const lines = [
    `# ${config.app.website.title}`,
    "",
    `> ${config.app.website.description}`,
    "",
    "## Pages",
    "",
    `- [Home](${url("/")})`,
    `- [Showcase](${url("/showcase")})`,
    `- [Blog](${url("/blog")})`,
    `- [Products](${url("/products")})`,
    "",
    "## Blog posts",
    "",
    ...posts.map((post) => {
      const desc = post.data.description ? `: ${post.data.description}` : "";
      return `- [${post.data.title}](${url(`/blog/${post.id}`)})${desc}`;
    }),
    "",
    "## Products",
    "",
    ...products.map((p) => {
      const desc = p.data.seo.description ? `: ${p.data.seo.description}` : "";
      return `- [${p.data.title}](${url(`/products/${p.data.handle}`)})${desc}`;
    }),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
