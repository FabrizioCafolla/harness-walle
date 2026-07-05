// Consumer-owned example POST endpoint (walle SEED): created once, never overwritten by
// `walle update`. Edit or replace it freely. Requires SSR — enable `astro.ssr` in
// `src/configs/app.json`. Echoes the JSON request body back in the response.
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return new Response(JSON.stringify({ error: "expected application/json" }), {
      status: 415,
      headers: { "content-type": "application/json" },
    });
  }
  const body = await request.json().catch(() => null);
  return new Response(JSON.stringify({ echo: body }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
