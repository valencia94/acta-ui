// src/lib/api.ts – Unified API helper for ACTA‑UI buttons
// -----------------------------------------------------------
// This **replaces** every previous version of api.ts in the repo. It wires the
// five priority endpoints (Generate, Download PDF/DOCX, Preview PDF, Send
// Approval, Check status) and makes sure all requests include a fresh Cognito
// JWT. Any component can now just import the functions below.
// -----------------------------------------------------------

import {
  apiBaseUrl,
  s3Bucket,
  s3Region,
  cloudfrontUrl,
  cloudfrontDistributionId,
} from '@/env.variables';
import { getAuthToken } from '@/utils/fetchWrapper';

/**
 * ---------------------------------------------------------------------------
 *  🔧 GLOBAL CONSTANTS
 * ---------------------------------------------------------------------------
 */
export const BASE =
  apiBaseUrl ||
  'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

export const S3_BUCKET = s3Bucket || 'projectplace-dv-2025-x9a7b';
export const AWS_REGION = s3Region || 'us-east-2';

/** -------------------------------------------------------------------------
 * 🛠️ Utility – signed / authorised fetch
 * --------------------------------------------------------------------------*/
async function request<T = unknown>(
  endpoint: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (options.auth !== false) {
    console.log('🔐 Attempting to get auth token for request to:', endpoint);
    try {
      const token = await getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ Authorization header added to request');
      } else {
        console.warn('⚠️ No auth token available for request');
      }
    } catch (error) {
      console.error('❌ Failed to get auth token:', error);
    }
  }

  console.log('🌐 Making request to:', `${BASE}${endpoint}`, {
    method: options.method || 'GET',
    hasAuth: !!headers['Authorization']
  });

  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers,
  });

  console.log('📡 Request response:', {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    console.error('❌ Request failed:', `${endpoint} → ${res.status}: ${txt}`);
    throw new Error(`${endpoint} → ${res.status}: ${txt}`);
  }

  if (options.method === 'HEAD') return undefined as unknown as T;
  if (options.redirect === 'manual') return res as unknown as T;
  return (await res.json()) as T;
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
export const getSummary = (id: string) =>
  request<ProjectSummary>(`/project-summary/${id}`);
export const getTimeline = (id: string) =>
  request<TimelineEvent[]>(`/timeline/${id}`);

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

  return request<{ message: string; success: boolean }>(
    `/extract-project-place/${projectId}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/** -------------------------------------------------------------------------
 * 🏗️ 2 & 3. Download DOCX / PDF
 * --------------------------------------------------------------------------*/
export async function getSignedDownloadUrl(
  projectId: string,
  format: 'pdf' | 'docx'
): Promise<string> {
  const res = (await request<Response>(
    `/download-acta/${projectId}?format=${format}`,
    {
      method: 'GET',
      redirect: 'manual',
    }
  )) as Response;

  if (res.status !== 302) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`Download‑endpoint error ${res.status}: ${txt}`);
  }

  const url = res.headers.get('Location');
  if (!url) throw new Error('Missing Location header in 302 response');
  return url;
}

/** -------------------------------------------------------------------------
 * 🏗️ 4. Send approval e‑mail to client
 * --------------------------------------------------------------------------*/
export const sendApprovalEmail = (actaId: string, clientEmail: string) =>
  request<{ message: string }>(`/send-approval-email`, {
    method: 'POST',
    body: JSON.stringify({ actaId, clientEmail }),
  });

/** -------------------------------------------------------------------------
 * 🏗️ 5. HEAD check → is document already in S3/CloudFront?
 * --------------------------------------------------------------------------*/
export async function documentExists(
  projectId: string,
  format: 'pdf' | 'docx'
): Promise<boolean> {
  try {
    await request(`/check-document/${projectId}?format=${format}`, {
      method: 'HEAD',
    });
    return true;
  } catch {
    return false;
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
export const getDownloadUrl = getSignedDownloadUrl;
export const checkDocumentAvailability = documentExists;

export async function getProjectsByPM(pmEmail: string, isAdmin: boolean): Promise<PMProject[]> {
  return request<PMProject[]>(
    `/projects-for-pm?email=${encodeURIComponent(pmEmail)}&admin=${isAdmin}`
  );
}

export async function generateSummariesForPM(pmEmail: string): Promise<ProjectSummary[]> {
  return request<ProjectSummary[]>(
    `/project-summaries?email=${encodeURIComponent(pmEmail)}`
  );
}

export async function getAllProjects(): Promise<PMProject[]> {
  return request<PMProject[]>(`/all-projects`);
}

export async function getProjectSummaryForPM(projectId: string): Promise<ProjectSummary> {
  return request<ProjectSummary>(`/project-summary/${projectId}`);
}

export async function getPMProjectsWithSummary(pmEmail: string): Promise<ProjectSummary[]> {
  return request<ProjectSummary[]>(
    `/projects-with-summary?email=${encodeURIComponent(pmEmail)}`
  );
}

/** -------------------------------------------------------------------------
 * 🧪 Dev Tools – expose helpers to browser
 * --------------------------------------------------------------------------*/
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // @ts-ignore
  window.__actaApi = {
    ping: () => request<{ status: string }>('/health', { auth: false }),
    generateActaDocument,
    getSignedDownloadUrl,
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
