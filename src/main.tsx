import { Amplify } from "aws-amplify";
import awsConfig from "@/aws-exports.js";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import "@/styles/variables.css";
import "@/styles/amplify-overrides.css";
import "@/tailwind.css";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(awsConfig);
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
