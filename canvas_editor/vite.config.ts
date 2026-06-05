import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// Vite is rooted at the Django app dir; source lives in frontend/src and the
// build is emitted into Django's static/ tree (served via django-vite).
export default defineConfig({
  base: "/static/dist/",
  resolve: {
    alias: { "@": resolve(__dirname, "frontend/src") },
  },
  build: {
    outDir: resolve(__dirname, "static/dist"),
    emptyOutDir: true,
    manifest: "manifest.json",
    rollupOptions: {
      input: {
        editor: resolve(__dirname, "frontend/src/main.ts"),
        projects: resolve(__dirname, "frontend/src/projects.ts"),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    origin: "http://localhost:5173",
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["frontend/tests/**/*.test.ts"],
  },
});
