// Consumer-owned example API route (walle SEED): created once, never overwritten by `walle update`.
// Edit or replace it freely. Requires the node adapter: enable `astro.adapter: "node"` in
// `src/configs/app.json`. `prerender = false` keeps this endpoint server-rendered.
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
