import {
  APIGatewayClient,
  GetResourcesCommand,
  GetMethodCommand,
  PutMethodCommand,
  PutIntegrationCommand,
  PutMethodResponseCommand,
  PutIntegrationResponseCommand,
  CreateDeploymentCommand
} from "@aws-sdk/client-api-gateway";

const REGION  = process.env.AWS_REGION  || "us-east-2";
const API_ID  = process.env.API_ID      || "<PROD_API_ID>";
const STAGE   = process.env.API_STAGE   || "prod";

const ALLOWED_ORIGINS  = process.env.ALLOWED_ORIGINS  || "*";
const ALLOWED_HEADERS  = process.env.ALLOWED_HEADERS  || "Content-Type,Authorization";
const ALLOWED_METHODS  = process.env.ALLOWED_METHODS  || "GET,POST,PUT,DELETE,OPTIONS";

const client = new APIGatewayClient({ region: REGION });

async function ensureOptions(resourceId: string) {
  try {
    await client.send(new GetMethodCommand({
      restApiId: API_ID,
      resourceId,
      httpMethod: "OPTIONS"
    }));
    return false;                 // already configured
  } catch (_) { /* continue */ }

  // PUT /OPTIONS method
  await client.send(new PutMethodCommand({
    restApiId: API_ID,
    resourceId,
    httpMethod: "OPTIONS",
    authorizationType: "NONE"
  }));

  // MOCK integration
  await client.send(new PutIntegrationCommand({
    restApiId: API_ID,
    resourceId,
    httpMethod: "OPTIONS",
    type: "MOCK",
    requestTemplates: { "application/json": "{statusCode:200}" }
  }));

  // Method-level 200 response
  await client.send(new PutMethodResponseCommand({
    restApiId: API_ID,
    resourceId,
    httpMethod: "OPTIONS",
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Origin":  true,
      "method.response.header.Access-Control-Allow-Headers": true,
      "method.response.header.Access-Control-Allow-Methods": true
    }
  }));

  // Integration-level 200 response
  await client.send(new PutIntegrationResponseCommand({
    restApiId: API_ID,
    resourceId,
    httpMethod: "OPTIONS",
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Origin":  `'${ALLOWED_ORIGINS}'`,
      "method.response.header.Access-Control-Allow-Headers": `'${ALLOWED_HEADERS}'`,
      "method.response.header.Access-Control-Allow-Methods": `'${ALLOWED_METHODS}'`
    }
  }));
  return true;
}

async function main() {
  const resources = await client.send(new GetResourcesCommand({
    restApiId: API_ID,
    limit: 500
  }));

  let changed = false;
  for (const r of resources.items ?? []) {
    if (await ensureOptions(r.id as string)) changed = true;
  }

  if (changed) {
    await client.send(new CreateDeploymentCommand({
      restApiId: API_ID,
      stageName: STAGE,
      description: "Automated CORS enablement"
    }));
    console.log("✅ CORS rules applied & new deployment created");
  } else {
    console.log("ℹ️ CORS already configured – nothing to do");
  }
}

main().catch(err => {
  console.error("❌ enable-cors failed:", err);
  process.exit(1);
});
