import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import fs from "fs";
import path from "path";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Copy aws-exports.js + create 404.html for SPA routing
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

        // 🔄 Create 404.html fallback for S3/CloudFront
        const indexSrc = path.resolve(process.cwd(), "dist/index.html");
        const fallbackDest = path.resolve(process.cwd(), "dist/404.html");
        console.log(`🔄 Copying index.html to 404.html: ${indexSrc} → ${fallbackDest}`);

        if (fs.existsSync(indexSrc)) {
          try {
            fs.copyFileSync(indexSrc, fallbackDest);
            console.log("✅ 404.html created successfully.");
          } catch (error) {
            console.warn("⚠️ Failed to create 404.html:", error.message);
          }
        } else {
          console.warn("⚠️ index.html not found in dist. Cannot create 404.html.");
        }
      } else {
        console.warn("⚠️ aws-exports.js not found. Skipping copy.");
      }
    },
  };
}

// ✅ Dev-only SPA fallback (e.g. for /dashboard route in dev)
function spaFallback() {
  return {
    name: "spa-fallback",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (
          req.method === "GET" &&
          !req.url.startsWith("/api") &&
          !req.url.includes(".")
        ) {
          req.url = "/index.html";
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (
          req.method === "GET" &&
          !req.url.startsWith("/api") &&
          !req.url.includes(".")
        ) {
          req.url = "/index.html";
        }
        next();
      });
    },
  };
}

// ✅ Dev-only CORS mock response for OPTIONS
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

// ✅ Main Vite config
export default defineConfig(({ command }) => ({
  root: ".",
  publicDir: "public",
  base: "/",
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
              target: "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod",
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
                    "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token"
                  );
                  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
                  console.log("⬅️ Received response:", proxyRes.statusCode, req.url);
                });
              },
            },
          }
        : undefined,
  },
  preview: {
    port: 5000,
    historyApiFallback: true,
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
