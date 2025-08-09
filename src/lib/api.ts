// Unified API helpers for ACTA UI buttons and dashboard flows
// Endpoint base and AWS configuration are taken from environment variables
// to keep the code contract-safe and production ready.

import { toast } from 'react-hot-toast';

import { apiBaseUrl } from '@/env.variables';
import { fetcherRaw,get, post, postFireAndForget } from '@/utils/fetchWrapper';

// S3 presigning is not used client-side to avoid CORS and least-privilege issues

export const BASE =
  apiBaseUrl || 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';
export const API = BASE;

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
    pmEmail: userEmail,
    userRole,
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
 * Shared URL extraction from Response (handles 302, JSON, text formats)
 * -------------------------------------------------------------------- */
async function extractUrlFromResponse(res: Response): Promise<string> {
  // 1) 302 Location (support both header casings)
  const loc = res.headers.get("location") || res.headers.get("Location");
  if (loc && /^https?:\/\//i.test(loc)) return loc;

  const ctype = res.headers.get("content-type") || "";

  // 2) JSON shapes
  if (ctype.includes("application/json")) {
    const data = await res.json().catch(() => ({}));
    const candidate =
      data?.url ??
      data?.signedUrl ??
      data?.downloadUrl ??
      data?.presignedUrl ??
      data?.Location ??
      data?.data?.url ??
      data?.data?.signedUrl ??
      data?.result?.url;
    if (typeof candidate === "string" && /^https?:\/\//i.test(candidate)) return candidate;
    throw new Error("No URL in JSON response");
  }

  // 3) text/plain
  if (ctype.includes("text/plain")) {
    const trimmed = (await res.text()).trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
  }

  // 4) last‑ditch: try body as text
  const fallback = (await res.text().catch(() => "")).trim();
  if (/^https?:\/\//i.test(fallback)) return fallback;

  throw new Error("No download URL returned from API");
}

/** -----------------------------------------------------------------------
 * Download links (PDF or DOCX)
 * -------------------------------------------------------------------- */
export async function getDownloadLink(
  projectId: string,
  format: 'pdf' | 'docx',
): Promise<string> {
  const url = `${API}/download-acta/${encodeURIComponent(projectId)}?format=${format}`;
  console.info("[ACTA] Trying download endpoint:", url);
  const res = await fetcherRaw(url, { method: "GET", redirect: "manual" as RequestRedirect });
  if (!res.ok && res.status !== 302) throw new Error(`Download link failed: ${res.status} ${res.statusText}`);
  const resolved = await extractUrlFromResponse(res);
  console.info("[ACTA] Resolved download URL:", resolved);
  return resolved;
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
  const url = `${API}/preview-pdf/${encodeURIComponent(projectId)}`;
  console.info("[ACTA] Trying preview endpoint:", url);
  const res = await fetcherRaw(url, { method: "GET", redirect: "manual" as RequestRedirect });
  if (!res.ok && res.status !== 302) throw new Error(`Preview link failed: ${res.status} ${res.statusText}`);
  const resolved = await extractUrlFromResponse(res);
  console.info("[ACTA] Resolved preview URL:", resolved);
  return resolved;
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
  status?: string;
}

export async function checkDocumentInS3(
  projectId: string,
  format: 'pdf' | 'docx',
): Promise<DocumentCheckResult> {
  try {
    const res = await fetcherRaw(
      `${BASE}/document-validator/${projectId}?format=${format}`,
      { method: 'HEAD' },
    );
    if (res.ok) {
      const lastModified =
        res.headers.get('Last-Modified') || res.headers.get('last-modified') || undefined;
      const len = res.headers.get('Content-Length') || res.headers.get('content-length');
      const size = len ? parseInt(len, 10) : undefined;
      return {
        available: true,
        lastModified,
        size,
        s3Key: `acta-documents/acta-${projectId}.${format}`,
      };
    }
    if (res.status === 404) {
      toast('Document not ready yet.', { icon: '⏳' });
      return {
        available: false,
        status: 'not_found',
        s3Key: `acta-documents/acta-${projectId}.${format}`,
      };
    }
    return { available: false };
  } catch (err) {
    console.warn(`Document check failed for ${projectId}.${format}:`, err);
    if (err instanceof Error && err.message.includes('Network error')) {
      return {
        available: false,
        s3Key: `acta-documents/acta-${projectId}.${format}`,
        checkFailed: true,
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

