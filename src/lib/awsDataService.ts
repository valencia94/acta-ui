import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { DynamoDBClient, QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
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

// 🔁 kill switch: set to "0" to revert to old behavior instantly
const GROUPED = (import.meta.env.VITE_GROUPED_PROJECTS ?? '1') !== '0';

let cachedClients: {
  dynamoDB: DynamoDBClient;
  s3: S3Client;
  credProvider: ReturnType<typeof fromCognitoIdentityPool>;
} | null = null;

// ---------- tiny helpers (pure) ----------
const toDate = (v: unknown): number => {
  if (!v) return 0;
  const t = new Date(String(v)).getTime();
  return Number.isFinite(t) ? t : 0;
};

const pickLatest = <T extends Record<string, unknown>>(a: T, b: T): T => {
  const a1 = toDate(a.card_comment_date ?? a.last_comment_date);
  const b1 = toDate(b.card_comment_date ?? b.last_comment_date);
  if (a1 !== b1) return a1 > b1 ? a : b;
  const a2 = toDate(a.last_updated);
  const b2 = toDate(b.last_updated);
  return a2 >= b2 ? a : b;
};

function mapProjectStatus(project: any): string {
  if (project.status) return project.status;
  if (project.has_acta_document === true) return 'Completed';
  if (project.has_acta_document === false) return 'In Progress';
  if (project.last_updated) {
    const lastUpdated = new Date(project.last_updated);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return lastUpdated > thirtyDaysAgo ? 'Active' : 'Inactive';
  }
  return 'Active';
}

// ✅ One-time AWS clients using Identity Pool creds (no double resolve)
async function getAwsClients() {
  if (cachedClients) return cachedClients;

  const { tokens } = await fetchAuthSession();
  const token = tokens?.idToken?.toString();
  if (!token) throw new Error('❌ No ID token available');

  const credProvider = fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region: REGION }),
    identityPoolId: IDENTITY_POOL_ID,
    logins: {
      [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]: token,
    },
  });

  // optional: identityId log for diagnostics
  try {
    const resolved = await credProvider();
    console.log('🧠 Cognito identity:', (resolved as any).identityId);
  } catch {}

  const dynamoDB = new DynamoDBClient({ region: REGION, credentials: credProvider });
  const s3 = new S3Client({ region: REGION, credentials: credProvider });
  cachedClients = { dynamoDB, s3, credProvider };
  return cachedClients;
}

// 🧾 S3 signed URL (unchanged)
export async function getDownloadUrl(key: string, expiresIn = 60): Promise<string> {
  const { s3 } = await getAwsClients();
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return await getSignedUrl(s3, command, { expiresIn });
}

// 🔎 Main: return one row per unique project_id (with latest Hito/Actividad) when GROUPED on
export async function getProjectsForCurrentUser(): Promise<any[]> {
  const { dynamoDB } = await getAwsClients();

  const { tokens } = await fetchAuthSession();
  const email = tokens?.idToken?.payload?.email as string | undefined;
  if (!email) throw new Error('❌ No user email available');

  // slim query to pm_email-index
  const params: QueryCommandInput = {
    TableName: TABLE_NAME,
    IndexName: 'pm_email-index',
    KeyConditionExpression: 'pm_email = :email',
    ExpressionAttributeValues: { ':email': { S: email } },
    ProjectionExpression: [
      '#pid',
      'project_name',
      'pm_email',
      'planlet', // Hito
      'title',   // Actividad
      'card_comment_date',
      'last_comment_date',
      'last_updated',
      'has_acta_document',
      'status',
    ].join(', '),
    ExpressionAttributeNames: { '#pid': 'project_id' },
  };
  console.log('[ACTA] DynamoDB query params:', params);

  const result = await dynamoDB.send(new QueryCommand(params));
  const items = (result.Items || []).map((it) => unmarshall(it));

  if (!GROUPED) {
    // 🔙 legacy path (no grouping) — preserves exact old shape
    return items.map((project: any) => ({
      id: project.project_id || project.id,
      name: project.project_name || project.name || `Project ${project.project_id || project.id}`,
      pm: project.pm_email || project.pm || project.project_manager,
      status: mapProjectStatus(project),
      originalData: project,
    }));
  }

  // ✅ new grouped path: one line per project
  const byProject = new Map<string, Record<string, unknown>[]>();
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
      name: String((latest as any).project_name ?? (latest as any).name ?? pid),
      pm: String((latest as any).pm_email ?? (latest as any).pm ?? ''),
      hito: (latest as any).planlet ?? null,
      actividad: (latest as any).title ?? null,
      status: mapProjectStatus(latest),
      originalData: latest,
    };
  });

  rows.sort((a, b) => {
    const aT =
      toDate(a.originalData?.card_comment_date) ||
      toDate(a.originalData?.last_comment_date) ||
      toDate(a.originalData?.last_updated);
    const bT =
      toDate(b.originalData?.card_comment_date) ||
      toDate(b.originalData?.last_comment_date) ||
      toDate(b.originalData?.last_updated);
    return bT - aT;
  });

  return rows;
}

// (optional) admin-only: kept disabled to avoid accidental Scans in prod
export async function getAllProjectsScanRaw(): Promise<Record<string, unknown>[]> {
  throw new Error('Use a Query or dedicated admin API; Scan is disabled here.');
}
