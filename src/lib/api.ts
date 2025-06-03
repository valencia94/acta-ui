const BASE = import.meta.env.VITE_API_BASE_URL;

export interface ProjectSummary {
  project_id: string;
  project_name: string;
  pm?: string;
  project_manager?: string;
  [key: string]: unknown;
}

export interface TimelineEvent {
  hito?: string;
  milestone?: string;
  actividad?: string;
  activity?: string;
  [key: string]: unknown;
}

/* ---------- SUMMARY ---------- */
export async function getSummary(id: string): Promise<ProjectSummary> {
  const r = await fetch(`${BASE}/project-summary/${id}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ---------- TIMELINE ---------- */
export async function getTimeline(id: string): Promise<TimelineEvent[]> {
  const r = await fetch(`${BASE}/timeline/${id}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ---------- ACTA DOWNLOAD ---------- */
export async function getDownloadUrl(
  id: string,
  format: 'pdf' | 'docx'
): Promise<string> {
  const r = await fetch(`${BASE}/download-acta/${id}?format=${format}`, {
    redirect: 'manual',
  });
  // Accept any redirect (301, 302, 303, 307, 308) but default to 302 if you want
  if (![301, 302, 303, 307, 308].includes(r.status)) {
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
  const r = await fetch(`${BASE}/sendapprovalemail`, {
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
