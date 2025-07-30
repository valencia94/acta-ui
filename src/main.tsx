// src/main.tsx

// 🔐 AWS Amplify Setup

import { Amplify } from "aws-amplify";

// 🎨 Global Styles
import "@/styles/variables.css"; // Design tokens (colors, spacing)
import "@/styles/amplify-overrides.css"; // Amplify UI overrides
import "@/tailwind.css"; // Tailwind utilities
import "@aws-amplify/ui-react/styles.css"; // Amplify UI base styles

// ⚛️ React & App
import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";

// Wait for aws-exports.js to load via script tag before configuring Amplify
function waitForAwsConfig(): Promise<any> {
  return new Promise((resolve, reject) => {
    const checkInterval = 50; // Check every 50ms
    const maxWaitTime = 10000; // Wait up to 10 seconds
    let elapsedTime = 0;
    
    const checkForConfig = () => {
      if ((window as any).awsmobile) {
        console.log("✅ AWS config found, configuring Amplify...");
        resolve((window as any).awsmobile);
        return;
      }
      
      elapsedTime += checkInterval;
      if (elapsedTime >= maxWaitTime) {
        console.error("❌ aws-exports.js failed to load within 10 seconds");
        // Fallback: try to import the ES6 module version
        import("@/aws-exports").then(module => {
          console.log("🔄 Using fallback ES6 import for aws-exports");
          resolve(module.default);
        }).catch(err => {
          console.error("❌ Both window.awsmobile and ES6 import failed:", err);
          reject(err);
        });
        return;
      }
      
      setTimeout(checkForConfig, checkInterval);
    };
    
    checkForConfig();
  });
}

// Initialize app once AWS config is ready
async function initializeApp() {
  try {
    const awsConfig = await waitForAwsConfig();
    Amplify.configure(awsConfig);
    
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (error) {
    console.error("Failed to initialize app:", error);
    // Still try to render the app without proper AWS config
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
}

// Start the initialization
initializeApp();
