// ---------- src/lib/api.ts (LIVE AWS back-end) ----------
const BASE = import.meta.env.VITE_API_BASE_URL;

/* ---------- SUMMARY ---------- */
export async function getSummary(id: string) {
  const r = await fetch(`${BASE}/project-summary/${id}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();            // { project_id, project_name, … }
}

/* ---------- TIMELINE ---------- */
export async function getTimeline(id: string) {
  const r = await fetch(`${BASE}/timeline/${id}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();            // [ { hito, actividad, … } ]
}

/* ---------- ACTA DOWNLOAD ---------- */
export async function getDownloadUrl(
  id: string,
  format: "pdf" | "docx"
): Promise<string> {
  // Ask Lambda for the signed URL but DON’T follow the redirect –
  // we just need the “Location” header.
  const r = await fetch(
    `${BASE}/download-acta/${id}?format=${format}`,
    { redirect: "manual" }
  );

  if (r.status !== 302) {
    throw new Error(`Download endpoint returned ${r.status}`);
  }
  const url = r.headers.get("Location");
  if (!url) throw new Error("Missing Location header");
  return url;
}

/* ---------- APPROVAL E-MAIL ---------- */
/** triggers the Lambda that sends the approval e-mail
 *  returns { message, token } */
export async function sendApprovalEmail(
  projectId: string,
  recipient: string
) {
  const r = await fetch(`${BASE}/sendapprovalemail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, recipient }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<{ message: string; token: string }>;
}

/* ---------- PROJECT PLACE DATA EXTRACTOR ---------- */
/** triggers the Lambda that extracts ProjectPlace data for the project */
export async function extractProjectPlaceData(projectId: string) {
  const r = await fetch(`${BASE}/extract-project-place/${projectId}`, {
    method: "POST"
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json(); // You may want to type this with a suitable interface if you know the return shape
}
// ---------- end file ----------
