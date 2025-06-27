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

/** ---------- PM PROJECT MANAGEMENT (via Metadata Enricher) ---------- */
export interface PMProject {
  project_id: string;
  project_name: string;
  pm_email: string;
  project_status?: string;
  last_updated?: string;
  has_acta_document?: boolean;
  acta_last_generated?: string;
  // Enhanced metadata from enricher
  external_project_data?: {
    timeline_events?: number;
    completion_percentage?: number;
    budget_status?: string;
  };
  timeline_summary?: {
    total_milestones?: number;
    completed?: number;
    upcoming?: number;
  };
  days_since_update?: number;
  acta_status?: 'current' | 'outdated' | 'missing';
  priority_level?: 'low' | 'medium' | 'high';
}

export interface PMProjectsResponse {
  pm_email: string;
  total_projects: number;
  projects: PMProject[];
  summary: {
    with_acta: number;
    without_acta: number;
    recently_updated: number;
  };
}

// Get all projects assigned to a PM by email (via metadata enricher)
export async function getProjectsByPM(pmEmail: string): Promise<PMProject[]> {
  const response = await get<PMProjectsResponse>(
    `${BASE}/pm-projects/${encodeURIComponent(pmEmail)}`
  );
  return response.projects;
}

// Get enhanced PM projects with summary data
export async function getPMProjectsWithSummary(
  pmEmail: string
): Promise<PMProjectsResponse> {
  return get<PMProjectsResponse>(
    `${BASE}/pm-projects/${encodeURIComponent(pmEmail)}`
  );
}

// Get project summary (enhanced with PM context)
export async function getProjectSummaryForPM(
  projectId: string,
  pmEmail: string
): Promise<ProjectSummary & { pm_context?: PMProject }> {
  return get<ProjectSummary & { pm_context?: PMProject }>(
    `${BASE}/project-summary/${projectId}?pm_email=${encodeURIComponent(pmEmail)}`
  );
}

// Bulk generate summaries for all PM projects
export async function generateSummariesForPM(pmEmail: string): Promise<{
  success: string[];
  failed: string[];
  total: number;
}> {
  return post<{ success: string[]; failed: string[]; total: number }>(
    `${BASE}/bulk-generate-summaries`,
    { pm_email: pmEmail }
  );
}

/** ---------- CHECK DOCUMENT AVAILABILITY ---------- */
export async function checkDocumentAvailability(
  id: string,
  format: 'pdf' | 'docx'
): Promise<{ available: boolean; lastModified?: string }> {
  try {
    const response = await fetch(
      `${BASE}/check-document/${id}?format=${format}`,
      {
        method: 'HEAD',
      }
    );

    if (response.ok) {
      return {
        available: true,
        lastModified: response.headers.get('Last-Modified') || undefined,
      };
    }

    return { available: false };
  } catch (error) {
    console.warn('Error checking document availability:', error);
    return { available: false };
  }
}
