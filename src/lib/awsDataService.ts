import { Sha256 } from '@aws-crypto/sha256-js';
// Keep the original functionality while adding the new pattern
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';
import { fetchAuthSession } from 'aws-amplify/auth';

const REGION = import.meta.env.VITE_COGNITO_REGION || 'us-east-2';
const IDENTITY_POOL_ID = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID!;
const TABLE_NAME = import.meta.env.VITE_DYNAMODB_TABLE || 'ProjectPlace_DataExtrator_landing_table_v2';
const BUCKET = import.meta.env.VITE_S3_BUCKET || 'projectplace-dv-2025-x9a7b';

let cachedClients: {
  dynamoDB: DynamoDBClient;
  s3: S3Client;
} | null = null;

const _fetchWithSigV4 = async (url: string) => {
  const session = await fetchAuthSession();
  const credentials = session.credentials;
  if (!credentials) throw new Error('❌ No Cognito credentials');

  const signer = new SignatureV4({
    credentials,
    region: 'us-east-2',
    service: 'execute-api',
    sha256: Sha256,
  });

  const request = new HttpRequest({ hostname: new URL(url).hostname, method: 'GET', path: url });

  const signedRequest = await signer.sign(request);
  const response = await fetch(url, {
    headers: signedRequest.headers,
  });

  return response.json();
};

// ✅ Derive AWS credentials for this user session
async function getAwsClients() {
  if (cachedClients) return cachedClients;

  const { tokens } = await fetchAuthSession();
  const logins = {
    [`cognito-idp.${REGION}.amazonaws.com/${import.meta.env.VITE_COGNITO_POOL_ID}`]: tokens?.idToken?.toString() || '',
  };

  const credentials = fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region: REGION }),
    identityPoolId: IDENTITY_POOL_ID,
    logins,
  });

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
