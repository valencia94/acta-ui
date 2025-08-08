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

// Kill switch for grouping (legacy list by default = "0")
const GROUPED = (import.meta.env.VITE_GROUPED_PROJECTS ?? '0') !== '0';

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
  console.log('🧠 Resolved Cognito identity:', (resolved as any).identityId);
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

// ---------- helpers for grouping ----------
function toDate(v: unknown): number {
  if (!v) return 0;
  const t = new Date(String(v)).getTime();
  return Number.isFinite(t) ? t : 0;
}

function pickLatest<T extends Record<string, unknown>>(a: T, b: T): T {
  const a1 = toDate(a.card_comment_date ?? a.last_comment_date);
  const b1 = toDate(b.card_comment_date ?? b.last_comment_date);
  if (a1 !== b1) return a1 > b1 ? a : b;
  const a2 = toDate(a.last_updated);
  const b2 = toDate(b.last_updated);
  return a2 >= b2 ? a : b;
}

// ✅ Fetch projects for the current authenticated user directly from DynamoDB
export async function getProjectsForCurrentUser(): Promise<any> {
  try {
    const { dynamoDB } = await getAwsClients();

    // keep existing logging behavior
    const credentials = await getAwsCredentials();
    const resolved = await credentials();
    console.log('[ACTA] Cognito identity:', (resolved as any).identityId);

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
    } as const;
    console.log('[ACTA] DynamoDB query params:', params);

    const result = await dynamoDB.send(new QueryCommand(params));
    const items = (result.Items || []).map((item) => unmarshall(item));

    // Legacy path (no grouping): preserve EXACT original shape
    if (!GROUPED) {
      return items.map((project: any) => ({
        id: project.project_id || project.id,
        name: project.project_name || project.name || `Project ${project.project_id || project.id}`,
        pm: project.pm_email || project.pm || project.project_manager,
        status: mapProjectStatus(project),
        originalData: project,
        // additive only (safe to ignore in callers); present for consumers that want it
        hito: project.planlet ?? null,
        actividad: project.title ?? null,
      }));
    }

    // Grouped path: one line per unique project_id using latest activity
    const byProject = new Map<string, any[]>();
    for (const it of items) {
      const pid = String(it.project_id ?? it.id ?? '');
      if (!pid) continue;
      const arr = byProject.get(pid) ?? [];
      arr.push(it);
      byProject.set(pid, arr);
    }

    const rows = Array.from(byProject.entries()).map(([pid, list]) => {
      const latest = list.reduce(pickLatest);
      return {
        id: pid,
        name: String(latest.project_name ?? latest.name ?? pid),
        pm: String(latest.pm_email ?? latest.pm ?? latest.project_manager ?? ''),
        hito: latest.planlet ?? null,      // Planlet
        actividad: latest.title ?? null,   // Title
        status: mapProjectStatus(latest),
        originalData: latest,
      };
    });

    // newest activity first
    rows.sort((a, b) => {
      const aT = toDate(a.originalData?.card_comment_date) || toDate(a.originalData?.last_comment_date) || toDate(a.originalData?.last_updated);
      const bT = toDate(b.originalData?.card_comment_date) || toDate(b.originalData?.last_comment_date) || toDate(b.originalData?.last_updated);
      return
