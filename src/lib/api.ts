import { getDownloadUrl } from "@/lib/awsDataService"; // fallback for preview if needed
import { fetcher } from "@/utils/fetchWrapper";

const API = import.meta.env.VITE_API_BASE_URL!;

export async function generateActaDocument(projectId: string) {
  const url = `${API}/extract-project-place/${encodeURIComponent(projectId)}`;
  return fetcher(url, { method: "POST", body: "{}" });
}

export async function getDownloadLink(projectId: string, format: "pdf" | "docx") {
  const url = `${API}/download-acta/${encodeURIComponent(projectId)}?format=${format}`;
  const data = await fetcher<{ url?: string }>(url);
  if (!data?.url) throw new Error("No URL field in response");
  return data.url;
}

export async function previewPdfBackend(projectId: string) {
  const url = `${API}/preview-pdf/${encodeURIComponent(projectId)}`;
  const data = await fetcher<{ url?: string }>(url);
  if (!data?.url) throw new Error("No URL field in response");
  return data.url;
}

// Fallback if /preview-pdf is not available; assumes key format `actas/{projectId}/latest.pdf`
export async function previewPdfViaS3(projectId: string) {
  const key = `actas/${projectId}/latest.pdf`;
  return getDownloadUrl(key, 60);
}

export async function sendApprovalEmail(projectId: string, recipientEmail: string) {
  const url = `${API}/send-approval-email`;
  return fetcher(url, {
    method: "POST",
    body: JSON.stringify({ projectId, recipientEmail }),
  });
}

// Legacy helpers kept for compatibility
export type PMProject = { id: string; name: string; pm: string; status: string };

export async function getProjectsByPM(pmEmail: string, isAdmin: boolean): Promise<PMProject[]> {
  const url = `${API}/projects-for-pm?email=${encodeURIComponent(pmEmail)}&admin=${isAdmin}`;
  return fetcher(url);
}

export async function checkDocumentInS3(projectId: string, format: "pdf" | "docx") {
  const url = `${API}/check-document/${encodeURIComponent(projectId)}?format=${format}`;
  return fetcher(url);
}

export async function getAllProjects() {
  const url = `${API}/all-projects`;
  return fetcher(url);
}

export const getS3DownloadUrl = getDownloadLink;
