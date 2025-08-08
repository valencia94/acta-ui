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
import { fetcher, get, post } from '@/utils/fetchWrapper';

import { getDownloadUrl as getS3PresignedUrl } from './awsDataService';

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

export const getSummary = (id: string) =>
  get<ProjectSummary>(`${BASE}/project-summary/${id}`);
export const getTimeline = (id: string) =>
  get<TimelineEvent[]>(`${BASE}/timeline/${id}`);

/** -----------------------------------------------------------------------
 * Generate ACTA document
 * -------------------------------------------------------------------- */
export async function generateActaDocument(
  projectId: string,
  userEmail?: string,
  userRole: 'pm' | 'admin' = 'pm',
) {
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

  return post<{ message: string; success: boolean }>(
    `${BASE}/extract-project-place/${projectId}`,
    payload,
  );
}

/** -----------------------------------------------------------------------
 * Download links (PDF or DOCX)
 * -------------------------------------------------------------------- */
export async function getDownloadLink(
  projectId: string,
  format: 'pdf' | 'docx',
): Promise<string> {
  const url = `${BASE}/download-acta/${projectId}?format=${format}`;
  const response = await fetcher<{ url?: string; downloadUrl?: string }>(url, {
    method: 'GET',
  });

  if (typeof response === 'string') return response;
  if (response?.url || response?.downloadUrl) {
    return response.url || response.downloadUrl!;
  }
  throw new Error('No download URL returned from API');
}

export const getS3DownloadUrl = getDownloadLink;
export const getDownloadUrl = getDownloadLink;

/** -----------------------------------------------------------------------
 * Preview PDF helpers
 * -------------------------------------------------------------------- */
export async function previewPdfBackend(projectId: string): Promise<string> {
  const data = await get<{ url: string }>(`${BASE}/preview-pdf/${projectId}`);
  if (!data?.url) throw new Error('No preview URL returned from API');
  return data.url;
}

export async function previewPdfViaS3(projectId: string): Promise<string> {
  // Fallback: directly generate a signed URL via S3
  return getS3PresignedUrl(`acta-${projectId}.pdf`);
}

/** -----------------------------------------------------------------------
 * Send approval email
 * -------------------------------------------------------------------- */
export async function sendApprovalEmail(
  projectId: string,
  recipientEmail?: string,
) {
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

