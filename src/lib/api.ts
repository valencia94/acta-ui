// Unified API helpers for ACTA UI buttons and dashboard flows
// Endpoint base and AWS configuration are taken from environment variables
// to keep the code contract-safe and production ready.

import {
  apiBaseUrl,
  cloudfrontDistributionId,
  cloudfrontUrl,
  s3Bucket,
  s3Region,
} from '@/env.variables';
import { get, getAuthToken, post, postFireAndForget } from '@/utils/fetchWrapper';

// S3 presigning is not used client-side to avoid CORS and least-privilege issues

export const BASE =
  apiBaseUrl || 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';
export const S3_BUCKET = s3Bucket || 'projectplace-dv-2025-x9a7b';
export const AWS_REGION = s3Region || 'us-east-2';

/** -----------------------------------------------------------------------
 * Project metadata helpers
 * -------------------------------------------------------------------- */
export interface ProjectSummary {
  project_id: string;
  project_name: string;
  pm?: string;
  project_manager?: string;
  [k: string]: unknown;
}

export interface TimelineEvent {
  hito: string;
  actividades: string;
  desarrollo: string;
  fecha: string;
}

export const getSummary = (id: string): Promise<ProjectSummary> =>
  get<ProjectSummary>(`${BASE}/project-summary/${id}`);
export const getTimeline = (id: string): Promise<TimelineEvent[]> =>
  get<TimelineEvent[]>(`${BASE}/timeline/${id}`);

/** -----------------------------------------------------------------------
 * Generate ACTA document
 * -------------------------------------------------------------------- */
export async function generateActaDocument(
  projectId: string,
  userEmail?: string,
  userRole: 'pm' | 'admin' = 'pm',
): Promise<{ message: string; success: boolean }> {
  const payload = {
    projectId,
    pmEmail: userEmail,
    userRole,
    s3Bucket: S3_BUCKET,
    s3Region: AWS_REGION,
    cloudfrontDistributionId,
    cloudfrontUrl,
    requestSource: 'acta-ui',
    generateDocuments: true,
    extractMetadata: true,
    timestamp: new Date().toISOString(),
  };

  // Fire-and-forget: we treat immediate 2xx/202/504/timeout as accepted and move on.
  const result = await postFireAndForget(
    `${BASE}/extract-project-place/${projectId}`,
    payload,
    { timeoutMs: 5000 },
  );
  return { message: 'accepted', success: result.accepted };
}

/** -----------------------------------------------------------------------
 * Download links (PDF or DOCX)
 * -------------------------------------------------------------------- */
export async function getDownloadLink(
  projectId: string,
  format: 'pdf' | 'docx',
): Promise<string> {
  // The backend may implement either:
  // 1) GET /download-acta/{id}?format=... → 302 Location: <signed-url>
  // 2) GET /download-acta/{id}?format=... → 200 { url }
  // 3) GET /download-acta?project_id=...&format=... (legacy) → 302 or { url }
  // 4) GET /s3-download-url/{id}?format=... → 302 or { url } or text/plain
  async function tryVariant(url: string): Promise<string | null> {
    const token = await getAuthToken();
    console.log('[ACTA] Trying download endpoint:', url);
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: 'omit',
      mode: 'cors',
    });
    // 302 redirect style
    if (res.status === 302) {
      const loc = res.headers.get('Location');
      if (loc) return loc;
    }
    // JSON body style
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const data = await res.json();
          const u = data?.url || data?.downloadUrl || null;
          if (u) return u;
        } catch {
          // ignore parse error
        }
      } else {
        // Some Lambdas return the URL as plain text
        try {
          const text = await res.text();
          if (text && /^https?:\/\//i.test(text.trim())) return text.trim();
        } catch {
          // ignore
        }
      }
    }
    // 400 with body may indicate wrong variant
    if (res.status === 400) {
      const body = await res.text().catch(() => '');
      if (body.includes('project_id is required')) return null;
    }
    return null;
  }

  // Try path-parameter variant first
  const primary = await tryVariant(`${BASE}/download-acta/${encodeURIComponent(projectId)}?format=${format}`);
  if (primary) return primary;
  // Fallback to legacy query param variant
  const fallback = await tryVariant(`${BASE}/download-acta?project_id=${encodeURIComponent(projectId)}&format=${format}`);
  if (fallback) return fallback;
  // Try alternative resource used by some stacks
  const alt = await tryVariant(`${BASE}/s3-download-url/${encodeURIComponent(projectId)}?format=${format}`);
  if (alt) return alt;
  throw new Error('No download URL returned from API');
}

export async function getS3DownloadUrl(projectId: string, format: 'pdf' | 'docx'): Promise<string> {
  // Use backend endpoint to obtain a signed URL or redirect, avoiding direct S3 bucket listing from the browser.
  const apiUrl = await getDownloadLink(projectId, format);
  if (apiUrl) return apiUrl;
  throw new Error(`No ${format.toUpperCase()} download URL available for project ${projectId}`);
}
export const getDownloadUrl = getDownloadLink;

/** -----------------------------------------------------------------------
 * Preview PDF helpers
 * -------------------------------------------------------------------- */
export async function previewPdfBackend(projectId: string): Promise<string> {
  const data = await get<{ url: string }>(`${BASE}/preview-pdf/${projectId}`);
  if (!data?.url) throw new Error('No preview URL returned from API');
  return data.url;
}

export function previewPdfViaS3(projectId: string): Promise<string> {
  // Use the download link helper to obtain a previewable URL
  return getDownloadLink(projectId, 'pdf');
}

/** -----------------------------------------------------------------------
 * Send approval email
 * -------------------------------------------------------------------- */
export async function sendApprovalEmail(
  projectId: string,
  recipientEmail?: string,
): Promise<{ message: string }> {
  const fallbackEmail =
    recipientEmail ||
    (process.env.VITE_APPROVAL_EMAIL as string | undefined) ||
    (import.meta.env.VITE_APPROVAL_EMAIL as string | undefined);

  if (!fallbackEmail) {
    throw new Error('Please provide an email address for approval.');
  }

  return post<{ message: string }>(`${BASE}/send-approval-email`, {
    projectId,
    recipientEmail: fallbackEmail,
  });
}

/** -----------------------------------------------------------------------
 * Check document availability in S3
 * -------------------------------------------------------------------- */
export interface DocumentCheckResult {
  available: boolean;
  lastModified?: string;
  size?: number;
  s3Key?: string;
  checkFailed?: boolean;
}

export async function checkDocumentInS3(
  projectId: string,
  format: 'pdf' | 'docx',
): Promise<DocumentCheckResult> {
  try {
    const data = await get<DocumentCheckResult>(
      `${BASE}/check-document/${projectId}?format=${format}`,
    );
    return { available: true, ...data };
  } catch (err) {
    console.warn(`Document check failed for ${projectId}.${format}:`, err);
    // For network errors, assume document might exist but check failed
    if (err instanceof Error && err.message.includes('Network error')) {
      return { 
        available: false, 
        s3Key: `acta-${projectId}.${format}`,
        checkFailed: true 
      };
    }
    return { available: false };
  }
}

export const checkDocumentAvailability = checkDocumentInS3;
export const documentExists = checkDocumentInS3;

/** -----------------------------------------------------------------------
 * Project helpers
 * -------------------------------------------------------------------- */
export interface PMProject {
  id: string;
  name: string;
  pm: string;
  status: string;
  [k: string]: unknown;
}

export const getAllProjects = (): Promise<PMProject[]> => get<PMProject[]>(`${BASE}/pm-manager/all-projects`);

// Additional project lookups used by other modules
export const getProjectsByPM = (pmEmail: string, isAdmin: boolean): Promise<PMProject[]> =>
  get<PMProject[]>(
    `${BASE}/projects-for-pm?email=${encodeURIComponent(pmEmail)}&admin=${isAdmin}`,
  );

export const generateSummariesForPM = (pmEmail: string): Promise<ProjectSummary[]> =>
  get<ProjectSummary[]>(
    `${BASE}/project-summaries?email=${encodeURIComponent(pmEmail)}`,
  );

export const getProjectSummaryForPM = (projectId: string): Promise<ProjectSummary> =>
  get<ProjectSummary>(`${BASE}/project-summary/${projectId}`);

export const getPMProjectsWithSummary = (pmEmail: string): Promise<ProjectSummary[]> =>
  get<ProjectSummary[]>(
    `${BASE}/projects-with-summary?email=${encodeURIComponent(pmEmail)}`,
  );

/** -----------------------------------------------------------------------
 * Dev helpers – expose functions for debugging
 * -------------------------------------------------------------------- */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__actaApi = {
    generateActaDocument,
    getDownloadLink,
    previewPdfBackend,
    previewPdfViaS3,
    sendApprovalEmail,
    checkDocumentInS3,
    getAllProjects,
    getSummary,
    getTimeline,
  };
}

// Maintain window exports for backward compatibility with test files
if (typeof window !== 'undefined') {
  (window as any).getSummary = getSummary;
  (window as any).getTimeline = getTimeline;
  (window as any).getDownloadUrl = getDownloadLink;
  (window as any).sendApprovalEmail = sendApprovalEmail;
  (window as any).getAllProjects = getAllProjects;
  (window as any).checkDocumentInS3 = checkDocumentInS3;
  (window as any).generateActaDocument = generateActaDocument;
}

