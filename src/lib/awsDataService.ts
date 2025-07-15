// src/lib/awsDataService.ts
/**
 * TEMP OVERRIDE FOR TESTING
 * ✅ Uses static credentials from .env.production
 * 🚫 Skips Cognito completely
 */

import {
  DynamoDBClient,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import {
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fromEnv } from "@aws-sdk/credential-provider-env"; // 👈 forces static creds

const AWS_REGION = import.meta.env.VITE_AWS_REGION || 'us-east-2';
const DYNAMODB_TABLE = import.meta.env.VITE_DYNAMODB_TABLE || 'ProjectPlace_DataExtrator_landing_table_v2';
const S3_BUCKET = import.meta.env.VITE_S3_BUCKET || 'projectplace-dv-2025-x9a7b';

async function getAwsCredentials() {
  try {
    const creds = fromEnv(); // 👈 force static creds
    console.log("🔐 [FORCED] Using static AWS credentials via fromEnv()");
    return creds;
  } catch (error) {
    console.error("❌ Failed to get static AWS credentials:", error);
    throw error;
  }
}

async function getAwsClients() {
  const credentials = await getAwsCredentials();
  return {
    dynamoDbClient: new DynamoDBClient({ region: AWS_REGION, credentials }),
    s3Client: new S3Client({ region: AWS_REGION, credentials }),
  };
}

function parseDynamoDBItem(item) {
  const parsed = {};
  for (const [key, value] of Object.entries(item)) {
    if (value.S) parsed[key] = value.S;
    else if (value.N) parsed[key] = value.N;
    else if (value.BOOL) parsed[key] = value.BOOL;
    else if (value.NULL) parsed[key] = null;
    else parsed[key] = value;
  }
  return parsed;
}

export async function getAllProjects() {
  const { dynamoDbClient } = await getAwsClients();
  const response = await dynamoDbClient.send(new ScanCommand({ TableName: DYNAMODB_TABLE }));
  return (response.Items ?? []).map(parseDynamoDBItem);
}

export async function getProjectsByPM(pmEmail) {
  const { dynamoDbClient } = await getAwsClients();
  const response = await dynamoDbClient.send(new ScanCommand({
    TableName: DYNAMODB_TABLE,
    FilterExpression: '#pm = :pmEmail OR #project_manager = :pmEmail',
    ExpressionAttributeNames: {
      '#pm': 'pm',
      '#project_manager': 'project_manager',
    },
    ExpressionAttributeValues: {
      ':pmEmail': { S: pmEmail },
    },
  }));
  return (response.Items ?? []).map(parseDynamoDBItem);
}

export async function downloadDocument(projectId, format = 'pdf') {
  const { s3Client } = await getAwsClients();
  const objectKey = `documents/${projectId}.${format}`;
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: objectKey,
  });
  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return { success: true, downloadUrl, projectId, format };
}

export async function getProjectStats() {
  const projects = await getAllProjects();
  const stats = {
    totalProjects: projects.length,
    projectsByPM: projects.reduce((acc, p) => {
      const pm = p.pm || p.project_manager || 'unknown';
      acc[pm] = (acc[pm] || 0) + 1;
      return acc;
    }, {}),
    activeProjects: projects.filter(p => p.status === 'active').length,
    lastUpdated: new Date().toISOString(),
  };
  return stats;
}

export async function checkAWSConnection() {
  const result = { dynamodb: false, s3: false, credentials: false };
  try {
    const { dynamoDbClient } = await getAwsClients();
    await dynamoDbClient.send(new ScanCommand({
      TableName: DYNAMODB_TABLE,
      Select: 'COUNT',
      Limit: 1,
    }));
    result.dynamodb = result.credentials = result.s3 = true;
  } catch (error) {
    console.error("❌ AWS connection test failed:", error);
  }
  return result;
}
