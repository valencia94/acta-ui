// src/lib/api.ts – Unified API helper for ACTA‑UI buttons
// -----------------------------------------------------------
// This **replaces** every previous version of api.ts in the repo. It wires the
// five priority endpoints (Generate, Download PDF/DOCX, Preview PDF, Send
// Approval, Check status) and makes sure all requests include a fresh Cognito
// JWT. Any component can now just import the functions below.
// -----------------------------------------------------------

import {
  apiBaseUrl,
  cloudfrontDistributionId,
  cloudfrontUrl,
  s3Bucket,
  s3Region,
} from '@/env.variables';
import { fetcher, get, post } from '@/utils/fetchWrapper';

/**
 * ---------------------------------------------------------------------------
 *  🔧 GLOBAL CONSTANTS
 * ---------------------------------------------------------------------------
 */
export const BASE = apiBaseUrl || 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

export const S3_BUCKET = s3Bucket || 'projectplace-dv-2025-x9a7b';
export const AWS_REGION = s3Region || 'us-east-2';

/** -------------------------------------------------------------------------
 * 🛠️ Utility – signed / authorised fetch using SigV4-enabled fetchWrapper
 * --------------------------------------------------------------------------*/
async function request<T = unknown>(
  endpoint: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const url = `${BASE}${endpoint}`;

  let body: unknown = undefined;
  if (options.body) {
    try {
      body = JSON.parse(options.body as string);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('❌ Failed to parse request body as JSON:', options.body, err);
      }
      body = undefined;
    }
  }

  if (import.meta.env.DEV) {
    console.log('🌐 Request:', url, {
      method: options.method || 'GET',
      payload: body,
    });
  }

  if (options.method === 'POST') {
    return post<T>(url, body);
  } else {
    return get<T>(url);
  }
}

/** -------------------------------------------------------------------------
 * 📘 Project metadata helpers (optional)
 * --------------------------------------------------------------------------*/
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
export const getSummary = (id: string) => request<ProjectSummary>(`/project-summary/${id}`);
export const getTimeline = (id: string) => request<TimelineEvent[]>(`/timeline/${id}`);

/** -------------------------------------------------------------------------
 * 🏗️ 1. Generate ACTA (DOCX+PDF)
 * --------------------------------------------------------------------------*/
export async function generateActaDocument(
  projectId: string,
  userEmail: string,
  userRole: 'pm' | 'admin' = 'pm'
) {
  const payload = {
    projectId,
    pmEmail: userEmail,
    userRole,
    s3Bucket: S3_BUCKET,
    s3Region: AWS_REGION,
    cloudfrontDistributionId: cloudfrontDistributionId || 'EPQU7PVDLQXUA',
    cloudfrontUrl: cloudfrontUrl || 'https://d7t9x3j66yd8k.cloudfront.net',
    requestSource: 'acta-ui',
    generateDocuments: true,
    extractMetadata: true,
    timestamp: new Date().toISOString(),
  };

  return request<{ message: string; success: boolean }>(`/extract-project-place/${projectId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** -------------------------------------------------------------------------
 * 🏗️ 2 & 3. Download DOCX / PDF
 * --------------------------------------------------------------------------*/
export async function getS3DownloadUrl(
  projectId: string,
  format: 'pdf' | 'docx'
): Promise<string> {
  const url = `${BASE}/download-acta/${projectId}?format=${format}`;

  if (import.meta.env.DEV) {
    console.log('🔗 Getting download URL for:', url);
  }

  const response = await fetcher<{ downloadUrl?: string; url?: string }>(url, {
    method: 'GET',
  });

  if (typeof response === 'string') {
    return response;
  }

  if (response && (response.downloadUrl || response.url)) {
    return response.downloadUrl || response.url;
  }

  throw new Error('No download URL returned from API');
}

/** -------------------------------------------------------------------------
 * 🏗️ 4. Send approval e‑mail to client
 * --------------------------------------------------------------------------*/
export const sendApprovalEmail = (projectId: string, recipientEmail: string) =>
  request<{ message: string }>(`/send-approval-email`, {
    method: 'POST',
    body: JSON.stringify({ projectId, recipientEmail }),
  });

export interface DocumentCheckResult {
  available: boolean;
  lastModified?: string;
  size?: number;
  s3Key?: string;
}

/** -------------------------------------------------------------------------
 * 🏗️ 5. HEAD check → is document already in S3/CloudFront?
 * --------------------------------------------------------------------------*/
export async function documentExists(
  projectId: string,
  format: 'pdf' | 'docx'
): Promise<DocumentCheckResult> {
  try {
    const url = `${BASE}/check-document/${projectId}?format=${format}`;
    if (import.meta.env.DEV) {
      console.log('🔍 Checking document:', url);
    }
    const response = await fetcher<DocumentCheckResult>(url, {
      method: 'GET',
    });

    return {
      available: true,
      ...response,
    };
  } catch (error) {
    console.warn('Document check failed:', error);
    return {
      available: false,
    };
  }
}

/** -------------------------------------------------------------------------
 * ⭐ Additional ACTA Project Helpers
 * --------------------------------------------------------------------------*/
export interface PMProject {
  id: string;
  name: string;
  pm: string;
  status: string;
  [k: string]: unknown;
}

export const checkDocumentInS3 = documentExists;
export const getDownloadUrl = getS3DownloadUrl;
export const checkDocumentAvailability = documentExists;

export async function getProjectsByPM(pmEmail: string, isAdmin: boolean): Promise<PMProject[]> {
  return request<PMProject[]>(
    `/projects-for-pm?email=${encodeURIComponent(pmEmail)}&admin=${isAdmin}`
  );
}

export async function generateSummariesForPM(pmEmail: string): Promise<ProjectSummary[]> {
  return request<ProjectSummary[]>(`/project-summaries?email=${encodeURIComponent(pmEmail)}`);
}

export async function getAllProjects(): Promise<PMProject[]> {
  return request<PMProject[]>(`/all-projects`);
}

export async function getProjectSummaryForPM(projectId: string): Promise<ProjectSummary> {
  return request<ProjectSummary>(`/project-summary/${projectId}`);
}

export async function getPMProjectsWithSummary(pmEmail: string): Promise<ProjectSummary[]> {
  return request<ProjectSummary[]>(`/projects-with-summary?email=${encodeURIComponent(pmEmail)}`);
}

/** -------------------------------------------------------------------------
 * 🧪 Dev Tools – expose helpers to browser
 * --------------------------------------------------------------------------*/
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // @ts-ignore
  window.__actaApi = {
    ping: () => request<{ status: string }>('/health', { auth: false }),
    generateActaDocument,
    getS3DownloadUrl,
    documentExists,
    sendApprovalEmail,
    getSummary,
    getTimeline,
    getProjectsByPM,
    generateSummariesForPM,
    getAllProjects,
    getProjectSummaryForPM,
    getPMProjectsWithSummary,
  };
}
