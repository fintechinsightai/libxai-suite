import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
    }),
  ],
  server: {
    host: true,
    port: 5173,
    cors: true,
    strictPort: true,
    hmr: {
      overlay: true,
      // Usar el puerto del servidor para HMR
      port: 5173,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  css: {
    devSourcemap: true,
    modules: {
      generateScopedName: "[name]__[local]___[hash:base64:5]",
    },
  },
  // Habilitar modo desarrollador mejorado
  define: {
    __DEV__: true,
  },
  esbuild: {
    keepNames: true,
  },
});
