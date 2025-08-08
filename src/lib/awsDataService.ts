import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { fetchAuthSession } from "aws-amplify/auth";

// ---------- Env / constants ----------
const REGION = import.meta.env.VITE_COGNITO_REGION || "us-east-2";
const USER_POOL_ID =
  import.meta.env.VITE_COGNITO_POOL_ID || "us-east-2_FyHLtOhiY";
const IDENTITY_POOL_ID =
  import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID ||
  "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35";
const TABLE_NAME =
  import.meta.env.VITE_DYNAMODB_TABLE ||
  "ProjectPlace_DataExtrator_landing_table_v2";
const BUCKET =
  import.meta.env.VITE_S3_BUCKET || "projectplace-dv-2025-x9a7b";

// Kill switch for grouped dashboard rows (legacy = 0)
const GROUPED = (import.meta.env.VITE_GROUPED_PROJECTS ?? "1") !== "0";

// ---------- Types ----------
export interface ProjectRow {
  id: string;
  name: string;
  pm: string;
  hito: string | null;
  actividad: string | null;
  status: string;
  originalData?: Record<string, unknown>;
}

// ---------- Internal state ----------
let cached: {
  dynamoDB: DynamoDBClient;
  s3: S3Client;
  credProvider: ReturnType<typeof fromCognitoIdentityPool>;
} | null = null;

// ---------- Helpers ----------
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
  if (project.has_acta_document === true) return "Completed";
  if (project.has_acta_document === false) return "In Progress";
  if (project.last_updated) {
    const lastUpdated = new Date(project.last_updated);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return lastUpdated > thirtyDaysAgo ? "Active" : "Inactive";
  }
  return "Active";
}

// ---------- AWS client factory ----------
async function getAwsClients() {
  if (cached) return cached;

  const { tokens } = await fetchAuthSession();
  const token = tokens?.idToken?.toString();
  if (!token) throw new Error("❌ No ID token available");

  const credProvider = fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region: REGION }),
    identityPoolId: IDENTITY_POOL_ID,
    logins: {
      [`cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`]: token,
    },
  });

  // Optional diagnostic
  try {
    const resolved = await credProvider();
    console.log("🧠 Cognito identity:", (resolved as any).identityId);
  } catch {
    /* no-op */
  }

  const dynamoDB = new DynamoDBClient({ region: REGION, credentials: credProvider });
  const s3 = new S3Client({ region: REGION, credentials: credProvider });

  cached = { dynamoDB, s3, credProvider };
  return cached;
}

// ---------- Public API ----------

// S3 signed URL helper (PDF/DOCX/etc.)
export async function getDownloadUrl(key: string, expiresIn = 60): Promise<string> {
  const { s3 } = await getAwsClients();
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn });
}

// Legacy compatibility: keep this export for dashboards/tests that still import it.
// (Scan is fine here; we’re preserving prior behavior to avoid regression.)
export async function getAllProjects(): Promise<any> {
  const { dynamoDB } = await getAwsClients();
  const cmd = new ScanCommand({ TableName: TABLE_NAME });
  const res = await dynamoDB.send(cmd);
  return res.Items || [];
}

// Main: grouped list, one row per project_id with latest Hito/Actividad
export async function getProjectsForCurrentUser(): Promise<ProjectRow[] | any[]> {
  const { dynamoDB } = await getAwsClients();

  const { tokens } = await fetchAuthSession();
  const email = tokens?.idToken?.payload?.email as string | undefined;
  if (!email) throw new Error("❌ No user email available");

  const params: QueryCommandInput = {
    TableName: TABLE_NAME,
    IndexName: "pm_email-index",
    KeyConditionExpression: "pm_email = :email",
    ExpressionAttributeValues: { ":email": { S: email } },
    ProjectionExpression: [
      "#pid",
      "project_name",
      "pm_email",
      "planlet", // Hito
      "title",   // Actividad
      "card_comment_date",
      "last_comment_date",
      "last_updated",
      "has_acta_document",
      "status",
    ].join(", "),
    ExpressionAttributeNames: { "#pid": "project_id" },
  };

  console.log("[ACTA] DynamoDB query params:", params);
  const result = await dynamoDB.send(new QueryCommand(params));
  const items = (result.Items || []).map((it) => unmarshall(it));

  if (!GROUPED) {
    // Legacy shape (no grouping) preserved for instant rollback
    return items.map((project: any) => ({
      id: project.project_id || project.id,
      name: project.project_name || project.name || `Project ${project.project_id || project.id}`,
      pm: project.pm_email || project.pm || project.project_manager,
      status: mapProjectStatus(project),
      originalData: project,
    }));
  }

  // Group by project_id → pick latest card → shape row
  const byProject = new Map<string, Record<string, unknown>[]>();
  for (const it of items) {
    const pid = String(it.project_id ?? it.id ?? "");
    if (!pid) continue;
    const arr = byProject.get(pid) ?? [];
    arr.push(it);
    byProject.set(pid, arr);
  }

  const rows: ProjectRow[] = [];
  for (const [pid, list] of byProject.entries()) {
    const latest = list.reduce(pickLatest);
    rows.push({
      id: pid,
      name: String((latest as any).project_name ?? (latest as any).name ?? pid),
      pm: String((latest as any).pm_email ?? (latest as any).pm ?? ""),
      hito: (latest as any).planlet ?? null,
      actividad: (latest as any).title ?? null,
      status: mapProjectStatus(latest),
      originalData: latest,
    });
  }

  // Sort newest activity first
  rows.sort((a, b) => {
    const aT =
      toDate(rows[0]?.originalData?.card_comment_date) ||
      toDate(rows[0]?.originalData?.last_comment_date) ||
      toDate(rows[0]?.originalData?.last_updated);
    const bT =
      toDate(rows[0]?.originalData?.card_comment_date) ||
      toDate(rows[0]?.originalData?.last_comment_date) ||
      toDate(rows[0]?.originalData?.last_updated);
    return bT - aT;
  });

  return rows;
}
