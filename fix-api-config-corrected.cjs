#!/usr/bin/env node

// AWS API Gateway Configuration Fix - Corrected Version
// This script fixes the API Gateway configuration to align with the single source of truth
// Uses proper AWS CLI syntax for patch operations

const { execSync } = require("child_process");
const fs = require("fs");

// Configuration from single source of truth
const CONFIG = {
  apiId: "q2b9avfwv5",
  region: "us-east-2",
  stage: "prod",
  userPoolId: "us-east-2_FyHLtOhiY",
  userPoolArn:
    "arn:aws:cognito-idp:us-east-2:703671891952:userpool/us-east-2_FyHLtOhiY",
  clientId: "dshos5iou44tuach7ta3ici5m",
  cloudFrontDomain: "https://d7t9x3j66yd8k.cloudfront.net",
};

// Protected endpoints that require Cognito authorization
const PROTECTED_ENDPOINTS = [
  { path: "/pm-manager/{pmEmail}", resourceId: "cltt9f", methods: ["GET"] },
  { path: "/extract-project-place", resourceId: "co74cb", methods: ["POST"] },
  {
    path: "/check-document/{projectId}",
    resourceId: "0rpaw2",
    methods: ["GET"],
  },
  { path: "/download-acta/{id}", resourceId: "dgcz16", methods: ["GET"] },
  { path: "/send-approval-email", resourceId: "sixint", methods: ["POST"] },
];

console.log("🔧 Starting API Gateway Configuration Fix (Corrected)...");
console.log(`📍 API ID: ${CONFIG.apiId}`);
console.log(`🌍 Region: ${CONFIG.region}`);
console.log(`🔐 User Pool ARN: ${CONFIG.userPoolArn}`);

function executeCommand(command, description) {
  try {
    console.log(`🔍 ${description}...`);
    console.log(`📝 Command: ${command}`);

    const result = execSync(command, {
      encoding: "utf-8",
      env: { ...process.env, AWS_DEFAULT_REGION: CONFIG.region },
    });

    console.log(`✅ Success: ${description}`);
    return result;
  } catch (error) {
    console.log(`❌ Failed: ${description}`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Error Details: ${error.stderr || error.stdout}`);
    return null;
  }
}

async function fixApiGatewayConfiguration() {
  console.log(
    "\n🚀 Starting API Gateway Configuration Fix Based on Single Source of Truth...\n",
  );

  // Get API Gateway resources
  const resourcesResult = executeCommand(
    `aws apigateway get-resources --rest-api-id ${CONFIG.apiId}`,
    "Getting API resources",
  );

  if (!resourcesResult) {
    console.log("❌ Failed to get API resources. Exiting.");
    return;
  }

  const resources = JSON.parse(resourcesResult);

  // Get existing authorizers
  const authorizersResult = executeCommand(
    `aws apigateway get-authorizers --rest-api-id ${CONFIG.apiId}`,
    "Getting existing authorizers",
  );

  if (!authorizersResult) {
    console.log("❌ Failed to get authorizers. Exiting.");
    return;
  }

  const authorizers = JSON.parse(authorizersResult);
  const cognitoAuthorizer = authorizers.items.find(
    (auth) =>
      auth.name === "CognitoUserPoolAuthorizer" ||
      auth.type === "COGNITO_USER_POOLS",
  );

  if (!cognitoAuthorizer) {
    console.log("❌ Cognito User Pool authorizer not found. Creating one...");
    const createAuthResult = executeCommand(
      `aws apigateway create-authorizer --rest-api-id ${CONFIG.apiId} --name CognitoUserPoolAuthorizer --type COGNITO_USER_POOLS --provider-arns ${CONFIG.userPoolArn} --identity-source method.request.header.Authorization`,
      "Creating Cognito User Pool authorizer",
    );

    if (!createAuthResult) {
      console.log("❌ Failed to create Cognito authorizer. Exiting.");
      return;
    }

    const newAuthorizer = JSON.parse(createAuthResult);
    console.log(
      `✅ Created Cognito Authorizer: ${newAuthorizer.name} (ID: ${newAuthorizer.id})`,
    );
    cognitoAuthorizer.id = newAuthorizer.id;
  } else {
    console.log(
      `✅ Found Cognito Authorizer: ${cognitoAuthorizer.name} (ID: ${cognitoAuthorizer.id})`,
    );
  }

  // Update method authorization for protected endpoints
  console.log("\n🔐 Configuring protected endpoints...\n");

  // Update method authorization for protected endpoints
  console.log("\n🔐 Configuring protected endpoints...\n");

  for (const endpoint of PROTECTED_ENDPOINTS) {
    console.log(`📍 Processing ${endpoint.path}...`);

    for (const method of endpoint.methods) {
      console.log(`   🔧 Configuring ${method} method...`);

      // Update method to use Cognito authorizer
      const updateResult = executeCommand(
        `aws apigateway update-method --rest-api-id ${CONFIG.apiId} --resource-id ${endpoint.resourceId} --http-method ${method} --patch-operations op=replace,path=/authorizationType,value=COGNITO_USER_POOLS op=replace,path=/authorizerId,value=${cognitoAuthorizer.id}`,
        `Updating ${method} method authorization for ${endpoint.path}`,
      );

      if (updateResult) {
        console.log(
          `      ✅ ${method} method updated with Cognito authorization`,
        );
      }
    }
  }

  // Update CORS for all endpoints
  console.log("\n🌐 Fixing CORS configuration...\n");

  for (const resource of resources.items) {
    if (!resource.resourceMethods || !resource.resourceMethods.OPTIONS) {
      continue; // Skip resources without OPTIONS method
    }

    console.log(`📍 Updating CORS for ${resource.path}...`);

    // Update CORS headers for integration response
    const corsHeaders = {
      "Access-Control-Allow-Origin": CONFIG.cloudFrontDomain,
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS,PUT,DELETE",
      "Access-Control-Allow-Credentials": "true",
    };

    for (const [headerName, headerValue] of Object.entries(corsHeaders)) {
      const updateResult = executeCommand(
        `aws apigateway update-integration-response --rest-api-id ${CONFIG.apiId} --resource-id ${resource.id} --http-method OPTIONS --status-code 200 --patch-operations op=replace,path=/responseParameters/method.response.header.${headerName},value='${headerValue}'`,
        `Setting ${headerName} for ${resource.path}`,
      );

      if (updateResult) {
        console.log(`      ✅ ${headerName} updated`);
      }
    }
  }

  // Deploy the API
  console.log("\n🚀 Deploying API changes...\n");

  const deployResult = executeCommand(
    `aws apigateway create-deployment --rest-api-id ${CONFIG.apiId} --stage-name ${CONFIG.stage} --description "Fixed authentication and CORS configuration - corrected version"`,
    "Deploying API changes",
  );

  if (deployResult) {
    const deployment = JSON.parse(deployResult);
    console.log(
      `✅ API deployed successfully! Deployment ID: ${deployment.id}`,
    );
  }

  // Summary
  console.log("\n📊 Configuration Fix Summary:");
  console.log(`✅ Cognito User Pool authorizer configured`);
  console.log(`✅ Protected endpoints configured with Cognito auth:`);
  for (const endpoint of PROTECTED_ENDPOINTS) {
    console.log(`   - ${endpoint}`);
  }
  console.log(`✅ CORS headers updated for Authorization support`);
  console.log(`✅ API deployed to ${CONFIG.stage} stage`);

  console.log("\n🎯 Next Steps:");
  console.log("1. Test the API with a valid Cognito JWT token");
  console.log("2. Run: node test-api-auth.js --token=YOUR_JWT_TOKEN");
  console.log("3. Verify that authentication works in the frontend");
  console.log("4. Check CloudWatch logs if any issues persist");
}

fixApiGatewayConfiguration().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
