// src/lib/api.ts
// Unified API layer for ACTA UI: buttons + dashboard flows
// - Robust URL extraction (302/JSON/text)
// - Works with fetchWrapper that returns Response
// - Prefers same-origin /api base behind CloudFront to avoid CORS when available

import { toast } from "react-hot-toast";
import { fetcher } from "@/utils/fetchWrapper";

// -------- Base URL resolution (prefer same-origin /api if present) --------
function inferBase(): string {
  const envBase =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
    (typeof process !== "undefined" &&
      (process.env.VITE_API_BASE_URL as string | undefined));

  // If we’re on CloudFront and the distribution maps /api/* → API Gateway,
  // same-origin calls avoid CORS at the browser layer:contentReference[oaicite:4]{index=4}.
  if (typeof window !== "undefined" && window.location?.origin) {
    const sameOriginApi = `${window.location.origin}/api`;
    // Heuristic: use same-origin if env isn’t set or explicitly points elsewhere
    if (!envBase || envBase.includes("execute-api.")) return sameOriginApi;
  }
  return envBase || "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod";
}

export const API = inferBase();

// -------- Types --------
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

export interface PMProject {
  id: string;
  name: string;
  pm: string;
  status: string;
  [k: string]: unknown;
}

export interface DocumentCheckResult {
  available: boolean;
  lastModified?: string;
  size?: number;
  s3Key?: string;
  checkFailed?: boolean;
  status?: string;
}

// -------- Shared URL extraction (302, JSON shapes, text/plain, fallback) --------
async function resolveUrlFromResponse(res: Response): Promise<string> {
  // 1) 302 Location (support both casings)
  const loc = res.headers.get("location") || res.headers.get("Location");
  if (loc && /^https?:\/\//i.test(loc)) return loc;

  const ctype = res.headers.get("content-type") || "";

  // 2) JSON bodies with various URL keys
  if (ctype.includes("application/json")) {
    const data: any = await res.json().catch(() => ({}));
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
    const text = (await res.text()).trim();
    if (/^https?:\/\//i.test(text)) return text;
  }

  // 4) last‑ditch try: body as text
  const fallback = (await res.text().catch(() => "")).trim();
  if (/^https?:\/\//i.test(fallback)) return fallback;

  throw new Error("No download URL returned from API");
}

// -------- Project metadata --------
export const getSummary = (id: string): Promise<ProjectSummary> =>
  fetcher(`${API}/project-summary/${encodeURIComponent(id)}`).then((r) => r.json());

export const getTimeline = (id: string): Promise<TimelineEvent[]> =>
  fetcher(`${API}/timeline/${encodeURIComponent(id)}`).then((r) => r.json());

export const getAllProjects = (): Promise<PMProject[]> =>
  fetcher(`${API}/pm-manager/all-projects`).then((r) => r.json());

export const getProjectsByPM = (pmEmail: string, isAdmin: boolean): Promise<PMProject[]> =>
  fetcher(
    `${API}/projects-for-pm?email=${encodeURIComponent(pmEmail)}&admin=${isAdmin}`,
  ).then((r) => r.json());

export const generateSummariesForPM = (pmEmail: string): Promise<ProjectSummary[]> =>
  fetcher(`${API}/project-summaries?email=${encodeURIComponent(pmEmail)}`).then((r) =>
    r.json(),
  );

export const getProjectSummaryForPM = (projectId: string): Promise<ProjectSummary> =>
  fetcher(`${API}/project-summary/${encodeURIComponent(projectId)}`).then((r) => r.json());

export const getPMProjectsWithSummary = (pmEmail: string): Promise<ProjectSummary[]> =>
  fetcher(`${API}/projects-with-summary?email=${encodeURIComponent(pmEmail)}`).then((r) =>
    r.json(),
  );

// -------- Generate (fire-and-forget semantics implemented server-side) --------
export async function generateActaDocument(
  projectId: string,
  _userEmail?: string,
  _userRole: "pm" | "admin" = "pm",
): Promise<{ message: string; success?: boolean }> {
  const res = await fetcher(
    `${API}/extract-project-place/${encodeURIComponent(projectId)}`,
    { method: "POST", body: "{}" },
  );
  // Backend may return 202/200 JSON; normalize to {message}
  return res.json().catch(() => ({ message: "accepted" }));
}

// -------- Download links (PDF/DOCX) --------
export async function getDownloadLink(
  projectId: string,
  format: "pdf" | "docx",
): Promise<string> {
  const res = await fetcher(
    `${API}/download-acta/${encodeURIComponent(projectId)}?format=${format}`,
    { redirect: "manual" as RequestRedirect },
  );
  const url = await resolveUrlFromResponse(res);
  console.info("[ACTA] Resolved download URL:", url);
  return url;
}
export const getDownloadUrl = getDownloadLink;

// -------- Preview PDF --------
export async function previewPdfBackend(projectId: string): Promise<string> {
  const res = await fetcher(`${API}/preview-pdf/${encodeURIComponent(projectId)}`, {
    redirect: "manual" as RequestRedirect,
  });
  const url = await resolveUrlFromResponse(res);
  console.info("[ACTA] Resolved preview URL:", url);
  return url;
}

// Fallback preview via the same download link (keeps one canonical resolver)
export function previewPdfViaS3(projectId: string): Promise<string> {
  return getDownloadLink(projectId, "pdf");
}

// -------- Send approval email --------
export async function sendApprovalEmail(
  projectId: string,
  recipientEmail: string,
): Promise<{ message?: string }> {
  const res = await fetcher(`${API}/send-approval-email`, {
    method: "POST",
    body: JSON.stringify({ projectId, recipientEmail }),
  });
  return res.json().catch(() => ({}));
}

// -------- Document availability check --------
export async function checkDocumentInS3(
  projectId: string,
  format: "pdf" | "docx",
): Promise<DocumentCheckResult> {
  try {
    const res = await fetcher(
      `${API}/check-document/${encodeURIComponent(projectId)}?format=${format}`,
    );
    const data: any = await res.json().catch(() => ({}));
    return { available: true, ...data };
  } catch (err: any) {
    if (String(err?.message || "").includes("Network error")) {
      return { available: false, s3Key: `acta-${projectId}.${format}`, checkFailed: true };
    }
    return { available: false };
  }
}

// -------- Dev exposure (handy in console during manual QA) --------
if (import.meta.env.DEV && typeof window !== "undefined") {
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

// Back-compat globals used by some tests
if (typeof window !== "undefined") {
  (window as any).getSummary = getSummary;
  (window as any).getTimeline = getTimeline;
  (window as any).getDownloadUrl = getDownloadLink;
  (window as any).sendApprovalEmail = sendApprovalEmail;
  (window as any).getAllProjects = getAllProjects;
  (window as any).checkDocumentInS3 = checkDocumentInS3;
  (window as any).generateActaDocument = generateActaDocument;
}
