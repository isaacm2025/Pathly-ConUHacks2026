import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  logLevel: "error", // Suppress warnings, only show errors
  server: {
    port: 5173,
    strictPort: false, // Allow fallback to next available port
    proxy: {
      // Proxy API calls to your backend
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react()
  ]
});
