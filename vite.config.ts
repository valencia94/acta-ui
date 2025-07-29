// vite.config.ts
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import path from "path";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  root: ".",
  publicDir: "public",
  plugins: [
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
    rollupOptions: {
      external: ["fsevents"], // ✅ Prevents CI crashes
      output: {
        manualChunks: {
          "pdf-viewer": ["react-pdf"],
          "aws-sdk": ["@aws-sdk/client-cognito-identity", "@aws-sdk/client-dynamodb", "@aws-sdk/client-s3", "@aws-sdk/credential-provider-cognito-identity", "@aws-sdk/s3-request-presigner"],
          vendor: ["react", "react-dom"],
          ui: ["framer-motion", "lucide-react"],
          amplify: ["aws-amplify", "@aws-amplify/auth", "@aws-amplify/ui-react", "amazon-cognito-identity-js"],
        },
        chunkFileNames: (chunkInfo) => {
          const id = chunkInfo.facadeModuleId
            ? path.basename(
                chunkInfo.facadeModuleId,
                path.extname(chunkInfo.facadeModuleId),
              )
            : "chunk";
          return `assets/${id}-[hash].js`;
        },
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    chunkSizeWarningLimit: 1024,
  },
  ssr: {
    noExternal: ["aws-amplify"], // ✅ Fix for deep import issues
  },
});
