import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/query": {
        target: "https://tenant-aware-chatbot-agent.onrender.com/",
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/chat/, ""),
      },
      "/api": {
        target: "https://tenant-aware-chatbot-1.onrender.com/",
        changeOrigin: true,
        secure: false,
      },
    },
    cors: false, // This is not needed here; CORS is handled by the backend
  },
});
