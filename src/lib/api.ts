/* src/lib/api.ts ------------------------------------------------------- */
const BASE =
  import.meta.env.VITE_API_BASE_URL ??
  'https://4r0pt34gx4.execute-api.us-east-2.amazonaws.com/prod';

/* ---------- approval flow (already existed) ---------- */

export async function sendApprovalEmail(
  projectId: string,
  recipient: string,
) {
  const res = await fetch(`${BASE}/sendapprovalemail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, recipient }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<{ message: string; token: string }>;
}

/* ---------- NEW read-only endpoints ---------- */

export type ProjectSummary = {
  project_id: string;
  project_name: string;
  pm: string;
  pm_email: string;
  status: string;
  last_title: string;
  last_comment: string | null;
};

export function fetchSummary(id: string) {
  return fetch(`${BASE}/project-summary/${id}`).then(
    (r) => r.json() as Promise<ProjectSummary>,
  );
}

export type TimelineEntry = {
  hito: string;
  actividad: string;
  desarrollo: string;
  orden: number;
  fecha_crea: string;
};

export function fetchTimeline(id: string) {
  return fetch(`${BASE}/timeline/${id}`).then(
    (r) => r.json() as Promise<TimelineEntry[]>,
  );
}

/** presigned-URL generator */
export function getActaUrl(id: string, fmt: 'pdf' | 'docx' = 'pdf') {
  return `${BASE}/download-acta/${id}?format=${fmt}`;
}
