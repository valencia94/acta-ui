import { Sha256 } from '@aws-crypto/sha256-js';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';
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

async function signRequest(url: string) {
  const session = await fetchAuthSession();
  const credentials = session.credentials;
  if (!credentials) throw new Error('❌ No Cognito credentials');

  const signer = new SignatureV4({
    credentials,
    region: REGION,
    service: 'execute-api',
    sha256: Sha256,
  });

  const { hostname, pathname, search } = new URL(url);
  const request = new HttpRequest({ hostname, method: 'GET', path: pathname + search });
  const signedRequest = await signer.sign(request);
  const response = await fetch(url, { headers: signedRequest.headers });
  return response.json();
}

// ✅ Derive AWS credentials for this user session
export async function getAwsCredentials() {
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

// ✅ Fetch projects for the current authenticated user via SigV4-signed request
export async function getProjectsForCurrentUser(): Promise<any> {
  try {
    const { tokens } = await fetchAuthSession();
    const email = tokens?.idToken?.payload?.email as string | undefined;
    if (!email) throw new Error('❌ No user email available');

    const base =
      import.meta.env.VITE_API_BASE_URL ||
      'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';
    const url = `${base}/projects-for-pm?email=${encodeURIComponent(email)}&admin=false`;
    return signRequest(url);
  } catch (err) {
    console.warn('⚠️ Cognito authentication failed, using mock data for development:', err);
    // Return mock project data for development when Cognito is blocked
    return [
      {
        id: 'mock-project-1',
        name: 'Sample Project Alpha',
        pm: 'admin@ikusi.com',
        status: 'In Progress'
      },
      {
        id: 'mock-project-2', 
        name: 'Sample Project Beta',
        pm: 'admin@ikusi.com',
        status: 'Completed'
      }
    ];
  }
}
