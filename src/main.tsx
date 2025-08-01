import { Amplify } from "aws-amplify";
import { createRoot } from "react-dom/client";
import App from "@/App";
import awsConfig from "./aws-exports.js";
import "@/styles/variables.css";
import "@/styles/amplify-overrides.css";
import "@/tailwind.css";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(awsConfig);
createRoot(document.getElementById("root")!).render(<App />);
