import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts
      // (our SSR error wrapper). `vite build` emits a plain Web-standard
      // `{ fetch(request, env, ctx) }` handler at dist/server/server.js,
      // which api/index.ts adapts to a Vercel Edge Function — see vercel.json.
      server: { entry: "server" },
    }),
    viteReact(),
  ],
});
