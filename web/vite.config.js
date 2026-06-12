import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/phaser")) {
            return "phaser-vendor";
          }
          if (id.includes("/node_modules/react") || id.includes("/node_modules/scheduler")) {
            return "react-vendor";
          }
          if (id.includes("/node_modules/html-to-image")) {
            return "result-export";
          }
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
