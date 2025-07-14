// src/lib/api.ts – Unified API helper for ACTA‑UI buttons
// -----------------------------------------------------------
// This **replaces** every previous version of api.ts in the repo. It wires the
// five priority endpoints (Generate, Download PDF/DOCX, Preview PDF, Send
// Approval, Check status) and makes sure all requests include a fresh Cognito
// JWT.  Any component can now just import the functions below.
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
 *  🔧 GLOBAL CONSTANTS
 * ---------------------------------------------------------------------------
 */
export const BASE =
  apiBaseUrl ||
  // fallback directly to prod Gateway (hard‑coded so staging still works)
  'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

export const S3_BUCKET = s3Bucket || 'projectplace-dv-2025-x9a7b';
export const AWS_REGION = s3Region || 'us-east-2';

/** -------------------------------------------------------------------------
 * 🛠️ Utility – signed / authorised fetch
 * --------------------------------------------------------------------------*/
async function request<T = unknown>(
  endpoint: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // attach JWT when desired (default on)
  if (options.auth !== false) {
    const token = await getAuthToken().catch(() => undefined);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`${endpoint} → ${res.status}: ${txt}`);
  }

  // "HEAD" responses have no body
  if (options.method === 'HEAD') return undefined as unknown as T;
  if (options.redirect === 'manual') return res as unknown as T; // caller handles
  return (await res.json()) as T;
}

/** -------------------------------------------------------------------------
 * 📘 Project metadata helpers (optional – kept for completeness)
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
 * 🏗️ 1. Generate ACTA (DOCX+PDF)
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
 * 🏗️ 2 & 3. Download DOCX / PDF (and PDF Preview uses same URL)
 *   – returns a pre‑signed CloudFront URL via 302 → Location header
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
  )) as Response; // manual redirect branch

  if (res.status !== 302) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`Download‑endpoint error ${res.status}: ${txt}`);
  }

  const url = res.headers.get('Location');
  if (!url) throw new Error('Missing Location header in 302 response');
  return url;
}

/** -------------------------------------------------------------------------
 * 🏗️ 4. Send approval e‑mail to client
 * --------------------------------------------------------------------------*/
export const sendApprovalEmail = (actaId: string, clientEmail: string) =>
  request<{ message: string }>(`/send-approval-email`, {
    method: 'POST',
    body: JSON.stringify({ actaId, clientEmail }),
  });

/** -------------------------------------------------------------------------
 * 🏗️ 5. HEAD check → is document already in S3/CloudFront?
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
 * ⭐ Convenience wrappers used by Dashboard buttons
 * --------------------------------------------------------------------------*/
export const api = {
  // Health‑check (public)
  ping: () => request<{ status: string }>('/health', { auth: false }),
  // Generate
  generateActaDocument,
  // Download helpers
  getSignedDownloadUrl,
  documentExists,
  // E‑mail
  sendApprovalEmail,
  // Optional metadata
  getSummary,
  getTimeline,
};

// Make debug helpers available in the browser console (dev only)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // @ts-ignore – intentionally exposing for debugging
  window.__actaApi = api;
}
