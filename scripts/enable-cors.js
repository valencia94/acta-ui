#!/usr/bin/env node
import {
  APIGatewayClient,
  CreateDeploymentCommand,
  GetResourcesCommand,
  PutGatewayResponseCommand,
  PutIntegrationCommand,
  PutIntegrationResponseCommand,
  PutMethodCommand,
  PutMethodResponseCommand,
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
  // Ensure gateway responses include CORS so any 4XX/5XX/timeouts don't break CORS
  const corsHeaders = {
    'gatewayresponse.header.Access-Control-Allow-Origin': '\'*\'',
    'gatewayresponse.header.Access-Control-Allow-Headers': '\'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token\'',
    'gatewayresponse.header.Access-Control-Allow-Methods': '\'GET,POST,OPTIONS\'',
  };
  const responseTypes = [
    'DEFAULT_4XX',
    'DEFAULT_5XX',
    'BAD_REQUEST_PARAMETERS',
    'BAD_REQUEST_BODY',
    'UNAUTHORIZED',
    'ACCESS_DENIED',
    'MISSING_AUTHENTICATION_TOKEN',
    'INVALID_API_KEY',
    'AUTHORIZER_FAILURE',
    'AUTHORIZER_CONFIGURATION_ERROR',
    'THROTTLED',
    'QUOTA_EXCEEDED',
    'REQUEST_TOO_LARGE',
    'UNSUPPORTED_MEDIA_TYPE',
    'INTEGRATION_FAILURE',
    'INTEGRATION_TIMEOUT',
    'INVALID_SIGNATURE',
    'EXPIRED_TOKEN',
  ];
  for (const responseType of responseTypes) {
    try {
      await client.send(new PutGatewayResponseCommand({
        restApiId: API_ID,
        responseType,
        responseParameters: corsHeaders,
      }));
    } catch (e) {
      // ignore if already exists
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
