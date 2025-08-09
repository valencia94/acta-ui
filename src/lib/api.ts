import { getDownloadUrl as s3SignedUrl } from "@/lib/awsDataService";
import { fetcher } from "@/utils/fetchWrapper";

const API = import.meta.env.VITE_API_BASE_URL!;

// Handle 302 Location, text/plain body with URL, or JSON fields: url/signedUrl/downloadUrl/presignedUrl
async function extractUrlFromResponse(res: Response): Promise<string> {
  const loc = res.headers.get("Location");
  if (loc && /^https?:\/\//i.test(loc)) return loc;

  const ctype = res.headers.get("content-type") || "";

  if (ctype.includes("text/plain")) {
    const text = (await res.text()).trim();
    if (/^https?:\/\//i.test(text)) return text;
    console.error("Unexpected text response from server:", text);
    throw new Error("Unexpected text response from server");
  }

  if (ctype.includes("application/json")) {
    const data = await res.json().catch(() => ({}));
    const candidate =
      (data as any)?.url ||
      (data as any)?.signedUrl ||
      (data as any)?.downloadUrl ||
      (data as any)?.presignedUrl ||
      (data as any)?.Location ||
      (data as any)?.data?.url ||
      (data as any)?.data?.signedUrl ||
      (data as any)?.result?.url;
    if (candidate && /^https?:\/\//i.test(candidate)) return String(candidate);
    throw new Error(`No URL field in JSON response. Keys: ${Object.keys(data || {}).join(", ")}`);
  }

  const fallback = (await res.text().catch(() => "")).trim();
  if (/^https?:\/\//i.test(fallback)) return fallback;

  throw new Error(`Unsupported response type: ${ctype || "unknown"}`);
}

export async function generateActaDocument(
  projectId: string,
  _userEmail?: string,
  _userRole: 'pm' | 'admin' = 'pm'
) {
  const res = await fetcher(
    `${API}/extract-project-place/${encodeURIComponent(projectId)}`,
    { method: "POST", body: "{}" }
  );
  return res.json().catch(() => ({}));
}

export async function getDownloadLink(projectId: string, format: "pdf" | "docx") {
  const res = await fetcher(
    `${API}/download-acta/${encodeURIComponent(projectId)}?format=${format}`
  );
  return extractUrlFromResponse(res);
}

export async function previewPdfBackend(projectId: string) {
  const res = await fetcher(
    `${API}/preview-pdf/${encodeURIComponent(projectId)}`
  );
  return extractUrlFromResponse(res);
}

// Fallback if preview endpoint doesn’t exist; assumes conventional key
export async function previewPdfViaS3(projectId: string) {
  const key = `actas/${projectId}/latest.pdf`;
  return s3SignedUrl(key, 60);
}

export async function sendApprovalEmail(projectId: string, recipientEmail: string) {
  const res = await fetcher(`${API}/send-approval-email`, {
    method: "POST",
    body: JSON.stringify({ projectId, recipientEmail }),
  });
  return res.json().catch(() => ({}));
}

export async function getS3DownloadUrl(projectId: string, format: "pdf" | "docx") {
  return getDownloadLink(projectId, format);
}

export interface DocumentCheckResult {
  available: boolean;
  lastModified?: string;
  size?: number;
  s3Key?: string;
  checkFailed?: boolean;
}

export async function checkDocumentInS3(
  projectId: string,
  format: "pdf" | "docx"
): Promise<DocumentCheckResult> {
  try {
    const res = await fetcher(
      `${API}/check-document/${encodeURIComponent(projectId)}?format=${format}`
    );
    const data = await res.json().catch(() => ({}));
    return { available: true, ...(data as any) };
  } catch (err: any) {
    if (err.message && err.message.includes("Network error")) {
      return {
        available: false,
        s3Key: `acta-${projectId}.${format}`,
        checkFailed: true,
      };
    }
    return { available: false };
  }
}

export const checkDocumentAvailability = checkDocumentInS3;
export const documentExists = checkDocumentInS3;

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

export const getSummary = (id: string): Promise<ProjectSummary> =>
  fetcher(`${API}/project-summary/${id}`).then(res => res.json());
export const getTimeline = (id: string): Promise<TimelineEvent[]> =>
  fetcher(`${API}/timeline/${id}`).then(res => res.json());

export interface PMProject {
  id: string;
  name: string;
  pm: string;
  status: string;
  [k: string]: unknown;
}

export const getAllProjects = (): Promise<PMProject[]> =>
  fetcher(`${API}/pm-manager/all-projects`).then(res => res.json());

export const getProjectsByPM = (pmEmail: string, isAdmin: boolean): Promise<PMProject[]> =>
  fetcher(
    `${API}/projects-for-pm?email=${encodeURIComponent(pmEmail)}&admin=${isAdmin}`
  ).then(res => res.json());

export const generateSummariesForPM = (pmEmail: string): Promise<ProjectSummary[]> =>
  fetcher(
    `${API}/project-summaries?email=${encodeURIComponent(pmEmail)}`
  ).then(res => res.json());

export const getProjectSummaryForPM = (projectId: string): Promise<ProjectSummary> =>
  fetcher(`${API}/project-summary/${encodeURIComponent(projectId)}`).then(res => res.json());

export const getPMProjectsWithSummary = (pmEmail: string): Promise<ProjectSummary[]> =>
  fetcher(
    `${API}/projects-with-summary?email=${encodeURIComponent(pmEmail)}`
  ).then(res => res.json());

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

if (typeof window !== "undefined") {
  (window as any).getSummary = getSummary;
  (window as any).getTimeline = getTimeline;
  (window as any).getDownloadUrl = getDownloadLink;
  (window as any).sendApprovalEmail = sendApprovalEmail;
  (window as any).getAllProjects = getAllProjects;
  (window as any).checkDocumentInS3 = checkDocumentInS3;
  (window as any).generateActaDocument = generateActaDocument;
}
