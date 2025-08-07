import "@/styles/variables.css";
import "@/styles/amplify-overrides.css";
import "@/tailwind.css";
import "@aws-amplify/ui-react/styles.css";

import { Amplify } from "aws-amplify";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/App";

declare global {
  interface Window {
    awsmobile?: any;
  }
}

const configureAmplify = async () => {
  let attempts = 0;
  while (!window.awsmobile && attempts < 50) {
    await new Promise((r) => setTimeout(r, 100));
    attempts++;
  }
  if (window.awsmobile) {
    Amplify.configure(window.awsmobile);
    console.log("✅ Amplify configured:", window.awsmobile);
  } else {
    const awsExports = await import("@/aws-exports");
    Amplify.configure(awsExports.default);
    console.log("⚠️ Amplify fallback: imported aws-exports.js");
  }
};

void configureAmplify().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
});
