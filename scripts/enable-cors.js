#!/usr/bin/env node
import {
  APIGatewayClient,
  GetResourcesCommand,
  PutMethodCommand,
  PutIntegrationCommand,
  PutMethodResponseCommand,
  PutIntegrationResponseCommand,
  CreateDeploymentCommand
} from '@aws-sdk/client-api-gateway';

const API_ID = process.env.API_ID ?? '<PROD_API_ID>';
const API_STAGE = process.env.API_STAGE ?? 'prod';
const REGION = process.env.AWS_REGION ?? 'us-east-2';

if (API_ID === '<PROD_API_ID>') {
  console.error('❌ API_ID env var not set'); process.exit(1);
}

const client = new APIGatewayClient({ region: REGION });

async function enableCors() {
  const resources = await client.send(new GetResourcesCommand({ restApiId: API_ID }));
  let alreadyConfigured = 0;
  let newlyConfigured = 0;
  
  for (const resource of resources.items ?? []) {
    const resourceId = resource.id;
    if (!resourceId) continue;

    let resourceAlreadyConfigured = true;

    try {
      await client.send(new PutMethodCommand({
        restApiId: API_ID,
        resourceId,
        httpMethod: 'OPTIONS',
        authorizationType: 'NONE'
      }));
      resourceAlreadyConfigured = false;
    } catch (err) {
      if (err.name === 'ConflictException') {
        // Method already exists - check if it's configured properly
      } else {
        throw err;
      }
    }

    try {
      await client.send(new PutIntegrationCommand({
        restApiId: API_ID,
        resourceId,
        httpMethod: 'OPTIONS',
        type: 'MOCK',
        requestTemplates: { 'application/json': '{"statusCode":200}' }
      }));
      resourceAlreadyConfigured = false;
    } catch (err) {
      if (err.name === 'ConflictException') {
        // Integration already exists
      } else {
        throw err;
      }
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
      resourceAlreadyConfigured = false;
    } catch (err) {
      if (err.name === 'ConflictException') {
        // Method response already exists
      } else {
        throw err;
      }
    }

    try {
      await client.send(new PutIntegrationResponseCommand({
        restApiId: API_ID,
        resourceId,
        httpMethod: 'OPTIONS',
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
          'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS'",
          'method.response.header.Access-Control-Allow-Origin': "'*'"
        }
      }));
      resourceAlreadyConfigured = false;
    } catch (err) {
      if (err.name === 'ConflictException') {
        // Integration response already exists
      } else {
        throw err;
      }
    }

    if (resourceAlreadyConfigured) {
      alreadyConfigured++;
    } else {
      newlyConfigured++;
    }
  }

  if (newlyConfigured > 0) {
    await client.send(new CreateDeploymentCommand({
      restApiId: API_ID,
      stageName: API_STAGE,
      description: 'Enable CORS'
    }));
    console.log(`✅ CORS enabled for ${newlyConfigured} resources`);
  }
  
  if (alreadyConfigured > 0) {
    console.log(`ℹ️ CORS already configured for ${alreadyConfigured} resources – nothing to do`);
  }
}

enableCors().catch(err => {
  console.error('❌ Failed to enable CORS', err);
  process.exit(1);
});