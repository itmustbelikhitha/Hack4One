import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4200",
        changeOrigin: true
      }
    }
  },
  test: {
    environment: "jsdom",
    exclude: ["node_modules", "dist", "e2e"]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          charts: ["recharts"],
          icons: ["lucide-react"]
        }
      }
    }
  }
});
