// src/main.tsx

// 🔐 AWS Amplify Setup
import { Amplify } from "aws-amplify";
import awsmobile from "@/aws-exports";

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

// Configure Amplify directly with imported config
Amplify.configure(awsmobile);
console.log("✅ Amplify configured:", awsmobile);

// Set up error handling
window.addEventListener("error", (e) =>
  console.error("GlobalError:", (e as ErrorEvent).message)
);

// Render the app
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

console.log("🟢 App booted");
