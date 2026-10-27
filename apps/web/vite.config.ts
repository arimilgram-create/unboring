import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development the API server runs on port 8000; Vite forwards /api and /files to it.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: { allow: ["../.."] }, // lets the app import packages/shared (template catalog)
    proxy: {
      "/api": "http://localhost:8000",
      "/files": "http://localhost:8000",
    },
  },
});
