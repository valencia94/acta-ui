import { apiBaseUrl } from '../env.variables';

const BASE = apiBaseUrl;

export interface ProjectSummary {
  project_id: string;
  project_name: string;
  pm?: string;
  project_manager?: string;
  [key: string]: unknown;
}

export interface TimelineEvent {
  hito: string;
  actividades: string;
  desarrollo: string;
  fecha: string;
}

/* ---------- SUMMARY ---------- */
export async function getSummary(id: string): Promise<ProjectSummary> {
  const r = await fetch(`${BASE}/projectSummary/${id}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ---------- TIMELINE ---------- */
export async function getTimeline(id: string): Promise<TimelineEvent[]> {
  const r = await fetch(`${BASE}/timeline/${id}`);
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  // Validate structure a bit for safety
  if (!Array.isArray(data))
    throw new Error('Timeline response is not an array');
  // Optionally, you could validate each event's keys here if you want
  return data as TimelineEvent[];
}

/* ---------- ACTA DOWNLOAD ---------- */
export async function getDownloadUrl(
  id: string,
  format: 'pdf' | 'docx'
): Promise<string> {
  const r = await fetch(`${BASE}/download-acta/${id}?format=${format}`, {
    redirect: 'manual',
  });
  if (r.status !== 302) {
    throw new Error(`Download endpoint returned ${r.status}`);
  }
  const url = r.headers.get('Location');
  if (!url) throw new Error('Missing Location header');
  return url;
}

/* ---------- APPROVAL E-MAIL ---------- */
export async function sendApprovalEmail(
  projectId: string,
  recipient: string
): Promise<{ message: string; token: string }> {
  const r = await fetch(`${BASE}/send-approval-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, recipient }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ---------- PROJECT PLACE DATA EXTRACTOR ---------- */
export async function extractProjectPlaceData(
  projectId: string
): Promise<unknown> {
  const r = await fetch(`${BASE}/extract-project-place/${projectId}`, {
    method: 'POST',
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
