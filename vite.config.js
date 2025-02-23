import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals({
  nativeFetch: true
});

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    remix(),
  ],
  server: {
    port: 3333,
  },
});
