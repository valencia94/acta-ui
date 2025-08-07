#!/usr/bin/env node
import {
  APIGatewayClient,
  CreateDeploymentCommand,
  GetResourcesCommand,
  PutIntegrationCommand,
  PutIntegrationResponseCommand,
  PutMethodCommand,
  PutMethodResponseCommand} from '@aws-sdk/client-api-gateway';

const API_ID = process.env.API_ID ?? '<PROD_API_ID>';
const API_STAGE = process.env.API_STAGE ?? 'prod';
const REGION = process.env.AWS_REGION ?? 'us-east-2';

if (API_ID === '<PROD_API_ID>') {
  console.error('❌ API_ID env var not set'); process.exit(1);
}

const client = new APIGatewayClient({ region: REGION });

async function enableCors() {
  const resources = await client.send(new GetResourcesCommand({ restApiId: API_ID }));
  for (const resource of resources.items ?? []) {
    const resourceId = resource.id;
    if (!resourceId) continue;

    try {
      await client.send(new PutMethodCommand({
        restApiId: API_ID,
        resourceId,
        httpMethod: 'OPTIONS',
        authorizationType: 'NONE'
      }));
    } catch {
      // Ignore if method already exists
    }

    try {
      await client.send(new PutIntegrationCommand({
        restApiId: API_ID,
        resourceId,
        httpMethod: 'OPTIONS',
        type: 'MOCK',
        requestTemplates: { 'application/json': '{"statusCode":200}' }
      }));
    } catch {
      // Ignore if integration already exists
    }

    try {
      await client.send(new PutMethodResponseCommand({
        restApiId: API_ID,
        resourceId,
        httpMethod: 'OPTIONS',
        statusCode: '200',
        responseModels: { 'application/json': 'Empty' },
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': false,
          'method.response.header.Access-Control-Allow-Methods': false,
          'method.response.header.Access-Control-Allow-Origin': false
        }
      }));
    } catch {
      // Ignore if method response already exists
    }

    try {
      await client.send(new PutIntegrationResponseCommand({
        restApiId: API_ID,
        resourceId,
        httpMethod: 'OPTIONS',
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': '\'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token\'',
          'method.response.header.Access-Control-Allow-Methods': '\'GET,POST,OPTIONS\'',
          'method.response.header.Access-Control-Allow-Origin': '\'*\''
        }
      }));
    } catch {
      // Ignore if integration response already exists
    }
  }
  await client.send(new CreateDeploymentCommand({
    restApiId: API_ID,
    stageName: API_STAGE,
    description: 'Enable CORS'
  }));
  console.log('✅ CORS enabled');
}

enableCors().catch(err => {
  console.error('❌ Failed to enable CORS', err);
  process.exit(1);
});
