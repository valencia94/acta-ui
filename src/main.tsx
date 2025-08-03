import { Amplify } from "aws-amplify";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import "@/styles/variables.css";
import "@/styles/amplify-overrides.css";
import "@/tailwind.css";
import "@aws-amplify/ui-react/styles.css";

async function configureAmplify() {
  if (!(window as any).awsmobile) {
    await new Promise((resolve) =>
      window.addEventListener("awsmobile-loaded", resolve, { once: true }),
    );
  }
  Amplify.configure((window as any).awsmobile);
}

async function init() {
  await configureAmplify();
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

init();
