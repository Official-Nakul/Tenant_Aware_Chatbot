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
      "/chat": {
        target: "https://tenant-aware-chatbot.onrender.com/",
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/chat/, ""),
      },
    },
    cors: false, // This is not needed here; CORS is handled by the backend
  },
});
