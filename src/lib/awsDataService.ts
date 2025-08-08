import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { fetchAuthSession } from 'aws-amplify/auth';

const REGION = import.meta.env.VITE_COGNITO_REGION || 'us-east-2';
const USER_POOL_ID = import.meta.env.VITE_COGNITO_POOL_ID || 'us-east-2_FyHLtOhiY';
const IDENTITY_POOL_ID = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID || 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35';
const TABLE_NAME = import.meta.env.VITE_DYNAMODB_TABLE || 'ProjectPlace_DataExtrator_landing_table_v2';
const BUCKET = import.meta.env.VITE_S3_BUCKET || 'projectplace-dv-2025-x9a7b';

let cachedClients: {
  dynamoDB: DynamoDBClient;
  s3: S3Client;
} | null = null;

// ✅ Derive AWS credentials for this user session
export async function getAwsCredentials(): Promise<any> {
  const { tokens } = await fetchAuthSession();
  const token = tokens?.idToken?.toString();
  if (!token) throw new Error('❌ No ID token available');

  const credentials = fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region: REGION }),
    identityPoolId: IDENTITY_POOL_ID,
    logins: {
      [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]: token,
    },
  });

  const resolved = await credentials();
  console.log('🧠 Resolved Cognito identity:', resolved.identityId);
  return credentials;
}

async function getAwsClients() {
  if (cachedClients) return cachedClients;

  const credentials = await getAwsCredentials();
  const dynamoDB = new DynamoDBClient({ region: REGION, credentials });
  const s3 = new S3Client({ region: REGION, credentials });

  cachedClients = { dynamoDB, s3 };
  return cachedClients;
}

// ✅ Fetch all projects for the signed-in PM (basic example using Scan)
export async function getAllProjects(): Promise<any> {
  const { dynamoDB } = await getAwsClients();
  const command = new ScanCommand({ TableName: TABLE_NAME });
  const result = await dynamoDB.send(command);
  return result.Items || [];
}

// ✅ Generate signed download URL for a file in S3
export async function getDownloadUrl(key: string, expiresIn = 60): Promise<string> {
  const { s3 } = await getAwsClients();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return await getSignedUrl(s3, command, { expiresIn });
}

// ✅ Fetch projects for the current authenticated user directly from DynamoDB
export async function getProjectsForCurrentUser(): Promise<any> {
  try {
    const { dynamoDB } = await getAwsClients();
    const credentials = await getAwsCredentials();
    const resolved = await credentials();
    console.log('[ACTA] Cognito identity:', resolved.identityId);

    const { tokens } = await fetchAuthSession();
    const email = tokens?.idToken?.payload?.email as string | undefined;
    if (!email) throw new Error('❌ No user email available');

    const params = {
      TableName: TABLE_NAME,
      IndexName: 'pm_email-index',
      KeyConditionExpression: 'pm_email = :email',
      ExpressionAttributeValues: {
        ':email': { S: email },
      },
    };
    console.log('[ACTA] DynamoDB query params:', params);

    const result = await dynamoDB.send(new QueryCommand(params));

    const items = (result.Items || []).map((item) => unmarshall(item));

    return items.map((project: any) => ({
      id: project.project_id || project.id,
      name: project.project_name || project.name || `Project ${project.project_id || project.id}`,
      pm: project.pm_email || project.pm || project.project_manager,
      status: mapProjectStatus(project),
      originalData: project,
    }));
  } catch (error) {
    console.error('[ACTA] Failed to fetch projects from DynamoDB:', error);
    throw error;
  }
}

// Helper function to map project status from DynamoDB data
function mapProjectStatus(project: any): string {
  // Check for explicit status field
  if (project.status) return project.status;
  
  // Check if ACTA document exists
  if (project.has_acta_document === true) return 'Completed';
  if (project.has_acta_document === false) return 'In Progress';
  
  // Check last updated to determine if active
  if (project.last_updated) {
    const lastUpdated = new Date(project.last_updated);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return lastUpdated > thirtyDaysAgo ? 'Active' : 'Inactive';
  }
  
  // Default status
  return 'Active';
}
