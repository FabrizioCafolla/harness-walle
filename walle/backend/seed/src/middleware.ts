// Consumer-owned Astro middleware (walle SEED): created once, never overwritten by `walle update`.
// Edit or replace it freely. Middleware runs on every request when SSR is enabled.
// See: https://docs.astro.build/en/guides/middleware/
import type { MiddlewareHandler } from "astro";

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Example: attach a request ID to every response for tracing.
  const requestId = crypto.randomUUID();
  context.locals.requestId = requestId;

  const response = await next();

  // Clone response to add headers (Response is immutable once created).
  const headers = new Headers(response.headers);
  headers.set("X-Request-Id", requestId);
  return new Response(response.body, { status: response.status, headers });
};
