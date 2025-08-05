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

function spaFallback() {
  const rewrite = (req: any, res: any, next: any) => {
    if (
      req.method === "GET" &&
      !req.url.startsWith("/api") &&
      !req.url.includes(".")
    ) {
      req.url = "/index.html";
    }
    next();
  };
  return {
    name: "spa-fallback",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

function devCorsOptions() {
  return {
    name: "dev-cors-options",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (
          req.method === "OPTIONS" &&
          (req.url.startsWith("/api/projects-for-pm") ||
            req.url.startsWith("/api/all-projects"))
        ) {
          res.statusCode = 200;
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type,Authorization,X-Amz-Date,X-Amz-Security-Token"
          );
          res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
          res.end();
          return;
        }
        next();
      });
    },
  };
}

function copyAwsExports() {
  return {
    name: "copy-aws-exports",
    closeBundle() {
      const src = path.resolve(process.cwd(), "public/aws-exports.js");
      const dest = path.resolve(process.cwd(), "dist/aws-exports.js");
      const destDir = path.dirname(dest);

      console.log(`🧩 Copying aws-exports.js from ${src} → ${dest}`);

      if (fs.existsSync(src)) {
        try {
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          fs.copyFileSync(src, dest);
          console.log("✅ aws-exports.js copied successfully.");
        } catch (error: any) {
          console.warn("⚠️ Failed to copy aws-exports.js:", error.message);
        }
      } else {
        console.warn("⚠️ aws-exports.js not found. Skipping copy.");
      }
    },
  };
}

export default defineConfig(({ command }) => ({
  root: ".",
  publicDir: "public",
  plugins: [copyAwsExports(), react(), svgr(), spaFallback(), devCorsOptions()],
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
    proxy:
      command === "serve"
        ? {
            "/api": {
              target:
                "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod",
              changeOrigin: true,
              rewrite: (p) => p.replace(/^\/api/, ""),
              configure: (proxy) => {
                proxy.on("error", (err) => {
                  console.error("🔴 Proxy error:", err);
                });
                proxy.on("proxyReq", (proxyReq, req) => {
                  console.log("➡️ Sending request:", req.method, req.url);
                });
                proxy.on("proxyRes", (proxyRes, req, res) => {
                  res.setHeader("Access-Control-Allow-Origin", "*");
                  res.setHeader(
                    "Access-Control-Allow-Headers",
                    "Content-Type,Authorization,X-Amz-Date,X-Amz-Security-Token"
                  );
                  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
                  console.log(
                    "⬅️ Received response:",
                    proxyRes.statusCode,
                    req.url
                  );
                });
              },
            },
          }
        : undefined,
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
}));
