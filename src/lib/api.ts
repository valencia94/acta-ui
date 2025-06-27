// src/lib/api.ts

import { apiBaseUrl } from '@/env.variables';
import { get, post } from '@/utils/fetchWrapper';

const BASE = apiBaseUrl;

/** Project summary as returned by your API */
export interface ProjectSummary {
  project_id: string;
  project_name: string;
  pm?: string;
  project_manager?: string;
  [key: string]: unknown;
}

/** Single timeline event */
export interface TimelineEvent {
  hito: string;
  actividades: string;
  desarrollo: string;
  fecha: string;
}

/** ---------- SUMMARY ---------- */
export function getSummary(id: string): Promise<ProjectSummary> {
  return get<ProjectSummary>(`${BASE}/project-summary/${id}`);
}

/** ---------- TIMELINE ---------- */
export function getTimeline(id: string): Promise<TimelineEvent[]> {
  return get<TimelineEvent[]>(`${BASE}/timeline/${id}`);
}

/** ---------- ACTA DOWNLOAD (302 redirect) ---------- */
export async function getDownloadUrl(
  id: string,
  format: 'pdf' | 'docx'
): Promise<string> {
  const res = await fetch(`${BASE}/download-acta/${id}?format=${format}`, {
    method: 'GET',
    redirect: 'manual',
  });
  if (res.status !== 302) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Download endpoint returned ${res.status}: ${errText}`);
  }
  const url = res.headers.get('Location');
  if (!url) {
    throw new Error('Download endpoint missing Location header');
  }
  return url;
}

/** ---------- APPROVAL E-MAIL ---------- */
export function sendApprovalEmail(
  actaId: string,
  clientEmail: string
): Promise<{ message: string; token: string }> {
  return post<{ message: string; token: string }>(
    `${BASE}/send-approval-email`,
    { actaId, clientEmail }
  );
}

/** ---------- PROJECT PLACE DATA EXTRACTOR ---------- */
export function extractProjectPlaceData(projectId: string): Promise<unknown> {
  return post<unknown>(`${BASE}/extract-project-place/${projectId}`);
}
