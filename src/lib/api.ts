// src/lib/api.ts

import { apiBaseUrl } from '@/env.variables';
import { get, post, getAuthToken } from '@/utils/fetchWrapper';
import { apiGet, apiPost, getCurrentUser } from './api-amplify';

const BASE = apiBaseUrl;

/** Basic API helpers used by the Dashboard buttons */
export async function generateActa(projectId: string): Promise<any> {
  const token = await getAuthToken();
  const res = await fetch(`${BASE}/extract-project-place/${projectId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`generateActa failed: ${txt}`);
  }
  return res.json();
}

export async function getDownloadUrl(
  projectId: string,
  fmt: 'pdf' | 'docx'
): Promise<string> {
  const token = await getAuthToken();
  const res = await fetch(
    `${BASE}/download-acta/${projectId}?format=${fmt}`,
    {
      method: 'GET',
      redirect: 'manual',
      headers: {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
      },
    }
  );
  if (res.status !== 302) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`Download failed: ${txt}`);
  }
  const url = res.headers.get('Location');
  if (!url) throw new Error('Missing download URL');
  return url;
}

export async function sendApprovalEmail(
  actaId: string,
  clientEmail: string
): Promise<any> {
  const token = await getAuthToken();
  const res = await fetch(`${BASE}/send-approval-email`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ actaId, clientEmail }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`sendApprovalEmail failed: ${txt}`);
  }
  return res.json();
}

export async function checkDocument(
  projectId: string,
  fmt: 'pdf' | 'docx'
): Promise<boolean> {
  const token = await getAuthToken();
  const res = await fetch(
    `${BASE}/check-document/${projectId}?format=${fmt}`,
    {
      method: 'HEAD',
      headers: {
        Authorization: `Bearer ${token || ''}`,
      },
    }
  );
  return res.ok;
}

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
  return apiGet<ProjectSummary>(`${BASE}/project-summary/${id}`);
}

/** ---------- TIMELINE ---------- */
export function getTimeline(id: string): Promise<TimelineEvent[]> {
  return apiGet<TimelineEvent[]>(`${BASE}/timeline/${id}`);
}



/** ---------- PROJECT PLACE DATA EXTRACTOR ---------- */
export function extractProjectPlaceData(projectId: string): Promise<unknown> {
  return apiPost<unknown>(`${BASE}/extract-project-place/${projectId}`);
}

/** ---------- ENHANCED S3 INTEGRATION FOR LAMBDA WORKFLOW ---------- */

// S3 bucket configuration
const S3_BUCKET = 'projectplace-dv-2025-x9a7b';

/**
 * Generate ACTA document via Lambda
 * This triggers the Lambda function that:
 * 1. Fetches external project data
 * 2. Generates DOCX document
 * 3. Stores in S3 bucket projectplace-dv-2025-x9a7b
 */
export async function generateActaDocument(
  projectId: string,
  userEmail: string,
  userRole: 'admin' | 'pm' = 'pm'
): Promise<{
  success: boolean;
  message: string;
  s3Location?: string;
  documentId?: string;
}> {
  console.log('🔄 Generating ACTA document for project:', projectId);
  console.log('📦 Target S3 bucket:', import.meta.env.VITE_S3_BUCKET || 'projectplace-dv-2025-x9a7b');

  // CORRECT PAYLOAD STRUCTURE for ProjectPlaceDataExtractor
  const payload = {
    projectId: projectId,
    pmEmail: userEmail,
    userRole: userRole,
    s3Bucket: import.meta.env.VITE_S3_BUCKET || 'projectplace-dv-2025-x9a7b',
    requestSource: 'acta-ui',
    generateDocuments: true,
    extractMetadata: true,
    timestamp: new Date().toISOString()
  };

  console.log('📋 Payload structure:', payload);

  const response = await apiPost<{
    success: boolean;
    message: string;
    s3Location?: string;
    documentId?: string;
    projectData?: any;
  }>(`${BASE}/extract-project-place/${projectId}`, payload);

  return {
    success: response.success || true,
    message: response.message || 'Document generation completed',
    s3Location: response.s3Location,
    documentId: response.documentId || projectId,
  };
}

/**
 * Enhanced document availability check with S3-specific logic
 */
export async function checkDocumentInS3(
  projectId: string,
  format: 'pdf' | 'docx'
): Promise<{
  available: boolean;
  lastModified?: string;
  size?: number;
  s3Key?: string;
}> {
  console.log(
    `🔍 Checking document availability in S3: ${projectId}.${format}`
  );

  try {
    const response = await fetch(
      `${BASE}/document-validator/${projectId}?format=${format}`,
      {
        method: 'HEAD',
      }
    );

    console.log(
      `📊 S3 check response: ${response.status} ${response.statusText}`
    );

    if (response.ok) {
      const lastModified = response.headers.get('Last-Modified');
      const contentLength = response.headers.get('Content-Length');
      const size = contentLength ? parseInt(contentLength, 10) : undefined;

      console.log(
        `✅ Document found in S3 - Size: ${size} bytes, Modified: ${lastModified}`
      );

      return {
        available: true,
        lastModified: lastModified || undefined,
        size,
        s3Key: `acta/${projectId}.${format}`,
      };
    }

    if (response.status === 404) {
      console.log(`📄 Document not found in S3: ${projectId}.${format}`);
    } else {
      console.warn(
        `⚠️ S3 check failed: ${response.status} ${response.statusText}`
      );
    }

    return { available: false };
  } catch (error) {
    console.warn('❌ Error checking document availability in S3:', error);
    return { available: false };
  }
}

/**
 * Enhanced download URL with S3 signed URL handling
 */
export async function getS3DownloadUrl(
  projectId: string,
  format: 'pdf' | 'docx'
): Promise<{
  success: boolean;
  downloadUrl?: string;
  error?: string;
  s3Info?: {
    bucket: string;
    key: string;
    signedUrl: string;
  };
}> {
  console.log(`📥 Getting S3 download URL for: ${projectId}.${format}`);
  console.log(
    `📦 Expected S3 path: s3://${S3_BUCKET}/acta/${projectId}.${format}`
  );

  try {
    const endpoint = `${BASE}/download-acta/${projectId}?format=${format}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      redirect: 'manual',
    });

    console.log(
      `📊 Download API response: ${response.status} ${response.statusText}`
    );
    console.log(
      '📋 Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    if (response.status === 302) {
      const signedUrl = response.headers.get('Location');

      if (signedUrl) {
        console.log(`🔗 Got S3 signed URL: ${signedUrl.substring(0, 100)}...`);

        // Verify the signed URL is accessible
        try {
          const urlTest = await fetch(signedUrl, { method: 'HEAD' });

          if (urlTest.ok) {
            console.log('✅ S3 signed URL is accessible');
            console.log(
              `📂 Content-Type: ${urlTest.headers.get('Content-Type')}`
            );
            console.log(
              `📏 Size: ${urlTest.headers.get('Content-Length')} bytes`
            );

            return {
              success: true,
              downloadUrl: signedUrl,
              s3Info: {
                bucket: S3_BUCKET,
                key: `acta/${projectId}.${format}`,
                signedUrl,
              },
            };
          } else {
            console.error(
              `❌ S3 signed URL not accessible: ${urlTest.status} ${urlTest.statusText}`
            );
            return {
              success: false,
              error: `S3 signed URL not accessible (${urlTest.status})`,
              downloadUrl: signedUrl, // Return it anyway for debugging
            };
          }
        } catch (urlError) {
          console.error('❌ Error testing S3 signed URL:', urlError);
          return {
            success: false,
            error: 'Failed to verify S3 signed URL',
            downloadUrl: signedUrl, // Return it anyway for debugging
          };
        }
      } else {
        console.error('❌ Missing Location header in 302 response');
        return {
          success: false,
          error: 'Missing S3 signed URL in response',
        };
      }
    } else if (response.status === 404) {
      console.log('📄 Document not found in S3 - may need to generate first');
      return {
        success: false,
        error: 'Document not found in S3 bucket',
      };
    } else {
      const errorText = await response.text().catch(() => response.statusText);
      console.error(`❌ Download API error: ${response.status} - ${errorText}`);

      let errorMessage = `Download failed (${response.status})`;
      if (response.status === 500) {
        errorMessage += ' - Lambda or S3 access error';
      } else if (response.status === 403) {
        errorMessage += ' - Insufficient permissions for S3 access';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (error) {
    console.error('❌ Network error getting S3 download URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
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
export async function getProjectsByPM(
  pmEmail: string,
  isAdmin: boolean = false
): Promise<ProjectSummary[]> {
  console.log('📋 Loading projects for PM:', pmEmail, 'Admin:', isAdmin);
  
  // Based on the API Gateway spec, try /projects first, fallback to pm-manager endpoints
  try {
    console.log('🌐 Trying /projects endpoint first');
    const endpoint = `${BASE}/projects`;
    console.log('🌐 Projects endpoint:', endpoint);
    
    const result = await apiGet<ProjectSummary[]>(endpoint);
    console.log('✅ /projects endpoint successful, got', result.length, 'projects');
    return result;
  } catch (error) {
    console.warn('⚠️ /projects endpoint failed, trying pm-manager endpoints', error);
    
    // Fallback to pm-manager endpoints
    const endpoint = isAdmin 
      ? `${BASE}/pm-manager/all-projects`
      : `${BASE}/pm-manager/${encodeURIComponent(pmEmail)}`;
    
    console.log('🌐 PM Projects endpoint (fallback):', endpoint);
    
    return apiGet<ProjectSummary[]>(endpoint);
  }
}

// Get all projects (admin only) - uses the pm-manager/all-projects endpoint
export async function getAllProjects(): Promise<ProjectSummary[]> {
  console.log('📋 Loading all projects (admin access)');
  
  // Try /projects first, then fallback to pm-manager/all-projects
  try {
    console.log('🌐 Trying /projects endpoint first');
    const endpoint = `${BASE}/projects`;
    console.log('🌐 Projects endpoint:', endpoint);
    
    const result = await apiGet<ProjectSummary[]>(endpoint);
    console.log('✅ /projects endpoint successful, got', result.length, 'projects');
    return result;
  } catch (error) {
    console.warn('⚠️ /projects endpoint failed, trying pm-manager/all-projects', error);
    
    // Fallback to pm-manager endpoint
    const endpoint = `${BASE}/pm-manager/all-projects`;
    console.log('🌐 All Projects endpoint (fallback):', endpoint);
    
    return apiGet<ProjectSummary[]>(endpoint);
  }
}

// Get enhanced PM projects with summary data - uses the pm-manager endpoints
export async function getPMProjectsWithSummary(
  pmEmail: string
): Promise<PMProjectsResponse> {
  // Use the correct endpoint that matches the actual API Gateway spec
  return apiGet<PMProjectsResponse>(`${BASE}/pm-manager/${encodeURIComponent(pmEmail)}`);
}

// Get project summary (enhanced with PM context)
export async function getProjectSummaryForPM(
  projectId: string,
  pmEmail: string
): Promise<ProjectSummary & { pm_context?: PMProject }> {
  return apiGet<ProjectSummary & { pm_context?: PMProject }>(
    `${BASE}/project-summary/${projectId}?pm_email=${encodeURIComponent(pmEmail)}`
  );
}

// Bulk generate summaries for all PM projects
export async function generateSummariesForPM(pmEmail: string): Promise<{
  success: string[];
  failed: string[];
  total: number;
}> {
  return apiPost<{ success: string[]; failed: string[]; total: number }>(
    `${BASE}/bulk-generate-summaries`,
    { pm_email: pmEmail }
  );
}

/** ---------- CHECK DOCUMENT AVAILABILITY ---------- */
export async function checkDocumentAvailability(
  projectId: string,
  format: 'pdf' | 'docx'
): Promise<{ available: boolean; lastModified?: string }> {
  try {
    // Use the correct endpoint that matches the API Gateway spec
    const response = await fetch(
      `${BASE}/check-document/${projectId}?format=${format}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json'
        }
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

// Attach critical API functions to window for test-production.js visibility
if (typeof window !== 'undefined') {
  window.getSummary = getSummary;
  window.getTimeline = getTimeline;
  window.getDownloadUrl = getDownloadUrl;
  window.sendApprovalEmail = sendApprovalEmail;
  window.fetchWrapper = apiGet; // Expose Cognito-authenticated GET as fetchWrapper for test
  window.getAuthToken = getAuthToken; // Keep for backward compatibility
  (window as any).getCurrentUser = getCurrentUser; // Add Cognito user info
}
