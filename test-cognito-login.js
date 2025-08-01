// test-cognito-login.js
// Script to verify Cognito login and token retrieval using aws-exports.js

import { Auth } from "aws-amplify";
import awsExports from "@/aws-exports.js";

Auth.configure(awsExports);

async function testCognitoLogin() {
  try {
    // Replace with a real test user
    const user = await Auth.signIn(
      "christian.valencia@ikusi.com",
      "PdYb7TU7HvBhYP7$!",
    );
    const session = await Auth.currentSession();
    const idToken = session.getIdToken().getJwtToken();
    console.log(
      "✅ Cognito login successful. idToken:",
      idToken.substring(0, 40) + "...",
    );
  } catch (err) {
    console.error("❌ Cognito login failed:", err);
  }
}

testCognitoLogin();
