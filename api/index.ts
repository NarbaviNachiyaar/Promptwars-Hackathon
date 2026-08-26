// Vercel Edge Function entry point.
//
// `vite build` (run as Vercel's buildCommand) produces `dist/server/server.js`,
// which exports a Web-standard `{ fetch(request, env, ctx) }` handler — the
// same handler TanStack Start's SSR runtime uses everywhere else. This file
// just adapts that handler to Vercel's Edge Function contract so every
// route (pages, assets that miss the static filesystem check, and server
// functions under /_serverFn) is handled by the same SSR runtime.
// @ts-ignore - dist/server/server.js is a build output generated at build
// time by `vite build`; it has no .d.ts and doesn't need one at runtime.
import handler from "../dist/server/server.js";

export const config = { runtime: "nodejs" };

export default function (request: Request) {
  return handler.fetch(request, {}, {});
}
