import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Dynamically import Replit plugins only if available
async function getReplitPlugins() {
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    try {
      const [errorModal, cartographer, devBanner] = await Promise.all([
        import("@replit/vite-plugin-runtime-error-modal").catch(() => null),
        import("@replit/vite-plugin-cartographer").catch(() => null),
        import("@replit/vite-plugin-dev-banner").catch(() => null),
      ]);
      
      return [
        errorModal?.default?.(),
        cartographer?.cartographer?.(),
        devBanner?.devBanner?.(),
      ].filter(Boolean);
    } catch {
      return [];
    }
  }
  return [];
}

export default defineConfig(async () => {
  const replitPlugins = await getReplitPlugins();
  
  return {
    plugins: [
      react(),
      ...replitPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    // root option removed - index.html is now at project root for Vite build compatibility
    publicDir: path.resolve(import.meta.dirname, "client", "public"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
