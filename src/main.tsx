// src/main.tsx

import { Amplify } from "aws-amplify";
import config from "../public/aws-exports.js";

import "@/styles/variables.css";
import "@/styles/amplify-overrides.css";
import "@/tailwind.css";
import "@aws-amplify/ui-react/styles.css";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";

Amplify.configure(config);
console.log("✅ Amplify configured:", config);

window.addEventListener("error", (e) => {
  console.error("🧨 Global JS Error:", e.message);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("🧨 Unhandled Promise Rejection:", (e as PromiseRejectionEvent).reason);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
