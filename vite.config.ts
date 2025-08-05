import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import fs from "fs";
import path from "path";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import { fileURLToPath } from "url";

// 🔁 Still needed for other dynamic paths (e.g. aliases)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: ".",
  publicDir: "public",
  plugins: [
    {
      name: "copy-aws-exports",
      closeBundle() {
        const src = path.resolve(process.cwd(), "public/aws-exports.js");
        const dest = path.resolve(process.cwd(), "dist/aws-exports.js");
        const destDir = path.dirname(dest);

        console.log(`🧩 Copying aws-exports.js from ${src} → ${dest}`);

        if (fs.existsSync(src)) {
          try {
            // Ensure destination directory exists
            if (!fs.existsSync(destDir)) {
              fs.mkdirSync(destDir, { recursive: true });
            }
            fs.copyFileSync(src, dest);
            console.log("✅ aws-exports.js copied successfully.");
          } catch (error) {
            console.warn("⚠️ Failed to copy aws-exports.js:", error.message);
          }
        } else {
          console.warn("⚠️ aws-exports.js not found. Skipping copy.");
        }
      },
    },
    react(),
    svgr(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  server: {
    host: true,
    port: 3000,
    open: true,
    proxy: {
      "/api": {
        target: "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.error("🔴 Proxy error:", err);
          });
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("➡️ Sending request:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log("⬅️ Received response:", proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  preview: {
    port: 5000,
  },
  build: {
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      external: ["fsevents"],
    },
  },
  ssr: {
    noExternal: ["aws-amplify"],
  },
});
