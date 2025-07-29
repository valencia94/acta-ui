#!/usr/bin/env node

// Debug AWS Cognito Identity Pool Configuration
import AWS from "aws-sdk";

// Set AWS region
AWS.config.update({ region: "us-east-2" });

const cognitoIdentity = new AWS.CognitoIdentity();

const IDENTITY_POOL_ID = "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35";

async function debugIdentityPool() {
  console.log("🔍 Debugging Cognito Identity Pool Configuration...");
  console.log("Identity Pool ID:", IDENTITY_POOL_ID);

  try {
    // Get identity pool details
    const poolDetails = await cognitoIdentity
      .describeIdentityPool({
        IdentityPoolId: IDENTITY_POOL_ID,
      })
      .promise();

    console.log("\n📋 Identity Pool Details:");
    console.log("- Identity Pool Name:", poolDetails.IdentityPoolName);
    console.log(
      "- Allow Unauthenticated:",
      poolDetails.AllowUnauthenticatedIdentities,
    );
    console.log("- Allow Classic Flow:", poolDetails.AllowClassicFlow);
    console.log(
      "- Cognito Identity Providers:",
      JSON.stringify(poolDetails.CognitoIdentityProviders, null, 2),
    );

    // Get identity pool roles
    const rolesResult = await cognitoIdentity
      .getIdentityPoolRoles({
        IdentityPoolId: IDENTITY_POOL_ID,
      })
      .promise();

    console.log("\n🔐 Identity Pool Roles:");
    console.log("- Roles:", JSON.stringify(rolesResult.Roles, null, 2));
    console.log(
      "- Role Mappings:",
      JSON.stringify(rolesResult.RoleMappings, null, 2),
    );

    // Check if roles exist
    if (rolesResult.Roles) {
      for (const [roleType, roleArn] of Object.entries(rolesResult.Roles)) {
        console.log(`\n✅ ${roleType} Role: ${roleArn}`);
      }
    } else {
      console.log("\n❌ No roles configured for identity pool");
    }

    console.log("\n🧪 Testing guest credentials...");
    try {
      const guestCredentials = await cognitoIdentity
        .getId({
          IdentityPoolId: IDENTITY_POOL_ID,
        })
        .promise();
      console.log("✅ Guest credentials work:", guestCredentials.IdentityId);
    } catch (error) {
      console.error("❌ Guest credentials failed:", error.message);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);

    if (error.code === "ResourceNotFoundException") {
      console.log("\n💡 The identity pool may not exist or may be deleted.");
    } else if (error.code === "InvalidIdentityPoolConfigurationException") {
      console.log("\n💡 The identity pool configuration is invalid.");
      console.log("   Common causes:");
      console.log("   - Missing or invalid IAM roles");
      console.log("   - Incorrect role trust relationships");
      console.log("   - Identity pool is not properly configured");
    }
  }
}

debugIdentityPool().catch(console.error);
