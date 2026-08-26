// Vercel Edge Function entry point.
//
// `vite build` (run as Vercel's buildCommand) produces `dist/server/server.js`,
// which exports a Web-standard `{ fetch(request, env, ctx) }` handler — the
// same handler TanStack Start's SSR runtime uses everywhere else. This file
// just adapts that handler to Vercel's Edge Function contract so every
// route (pages, assets that miss the static filesystem check, and server
// functions under /_serverFn) is handled by the same SSR runtime.
import handler from "../dist/server/server.js";

export const config = { runtime: "edge" };

export default function (request: Request) {
  return handler.fetch(request, {}, {});
}
