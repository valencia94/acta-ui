// src/main.tsx

// 🔐 AWS Amplify Setup
import { Amplify } from "aws-amplify";
import awsConfig from "./aws-exports.js";

// 🎨 Global Styles
import "@/styles/variables.css"; // Design tokens (colors, spacing)
import "@/styles/amplify-overrides.css"; // Amplify UI overrides
import "@/tailwind.css"; // Tailwind utilities
import "@aws-amplify/ui-react/styles.css"; // Amplify UI base styles

// ⚛️ React & App
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";

console.log("🧩 ENV", import.meta.env);

Amplify.configure(awsConfig);
console.log("AWS Amplify configured");

window.addEventListener("error", (e) =>
  console.error("GlobalError:", (e as ErrorEvent).message),
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

console.log("🟢 App booted");
