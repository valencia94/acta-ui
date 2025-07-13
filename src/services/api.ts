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
  const endpoint = `${BASE}/download-acta/${id}?format=${format}`;
  console.log(`🌐 Requesting download URL: ${endpoint}`);
  
  const res = await fetch(endpoint, {
    method: 'GET',
    redirect: 'manual',
  });
  
  console.log(`📡 Download API response: ${res.status} ${res.statusText}`);
  console.log(`📋 Response headers:`, Object.fromEntries(res.headers.entries()));
  
  if (res.status !== 302) {
    const errText = await res.text().catch(() => res.statusText);
    console.error(`❌ Download API error: ${res.status} - ${errText}`);
    throw new Error(`Download endpoint returned ${res.status}: ${errText}`);
  }
  
  const url = res.headers.get('Location');
  console.log(`📍 Location header:`, url);
  
  if (!url) {
    console.error('❌ Missing Location header in 302 response');
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
  // Handle admin access - get all projects
  if (pmEmail === 'admin-all-access') {
    const response = await get<PMProjectsResponse>(
      `${BASE}/pm-projects/all-projects`
    );
    return response.projects;
  }

  const response = await get<PMProjectsResponse>(
    `${BASE}/pm-projects/${encodeURIComponent(pmEmail)}`
  );
  return response.projects;
}

// Get enhanced PM projects with summary data
export async function getPMProjectsWithSummary(
  pmEmail: string
): Promise<PMProjectsResponse> {
  // Handle admin access
  if (pmEmail === 'admin-all-access') {
    return get<PMProjectsResponse>(`${BASE}/pm-projects/all-projects`);
  }

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
export async function generateActaDocument(projectId: string): Promise<{
  success: boolean;
  message: string;
  s3Location?: string;
  documentId?: string;
}> {
  console.log(`🔄 Generating ACTA document for project: ${projectId}`);
  console.log(`📦 Target S3 bucket: ${S3_BUCKET}`);
  
  try {
    const response = await post<{
      success: boolean;
      message: string;
      s3_location?: string;
      document_id?: string;
      bucket?: string;
      key?: string;
    }>(`${BASE}/extract-project-place/${projectId}`, {});
    
    console.log('✅ Document generation response:', response);
    
    // Check if the response indicates successful S3 storage
    if (response.s3_location || response.bucket) {
      console.log(`📁 Document stored in S3: ${response.s3_location || `s3://${response.bucket}/${response.key}`}`);
    }
    
    return {
      success: response.success || true,
      message: response.message || 'Document generation completed',
      s3Location: response.s3_location || (response.bucket && response.key ? `s3://${response.bucket}/${response.key}` : undefined),
      documentId: response.document_id || projectId
    };
    
  } catch (error) {
    console.error('❌ Document generation failed:', error);
    
    // Enhanced error messages based on common issues
    let errorMessage = 'Document generation failed';
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage += ' - Network or API Gateway issue';
      } else if (error.message.includes('500')) {
        errorMessage += ' - Lambda function error or external data source unavailable';
      } else if (error.message.includes('403')) {
        errorMessage += ' - Insufficient permissions for S3 or external data access';
      } else {
        errorMessage += ` - ${error.message}`;
      }
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
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
  console.log(`🔍 Checking document availability in S3: ${projectId}.${format}`);
  
  try {
    const response = await fetch(
      `${BASE}/check-document/${projectId}?format=${format}`,
      {
        method: 'HEAD',
      }
    );
    
    console.log(`📊 S3 check response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const lastModified = response.headers.get('Last-Modified');
      const contentLength = response.headers.get('Content-Length');
      const size = contentLength ? parseInt(contentLength, 10) : undefined;
      
      console.log(`✅ Document found in S3 - Size: ${size} bytes, Modified: ${lastModified}`);
      
      return {
        available: true,
        lastModified: lastModified || undefined,
        size,
        s3Key: `acta/${projectId}.${format}`
      };
    }
    
    if (response.status === 404) {
      console.log(`📄 Document not found in S3: ${projectId}.${format}`);
    } else {
      console.warn(`⚠️ S3 check failed: ${response.status} ${response.statusText}`);
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
  console.log(`📦 Expected S3 path: s3://${S3_BUCKET}/acta/${projectId}.${format}`);
  
  try {
    const endpoint = `${BASE}/download-acta/${projectId}?format=${format}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      redirect: 'manual',
    });
    
    console.log(`📊 Download API response: ${response.status} ${response.statusText}`);
    console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.status === 302) {
      const signedUrl = response.headers.get('Location');
      
      if (signedUrl) {
        console.log(`🔗 Got S3 signed URL: ${signedUrl.substring(0, 100)}...`);
        
        // Verify the signed URL is accessible
        try {
          const urlTest = await fetch(signedUrl, { method: 'HEAD' });
          
          if (urlTest.ok) {
            console.log('✅ S3 signed URL is accessible');
            console.log(`📂 Content-Type: ${urlTest.headers.get('Content-Type')}`);
            console.log(`📏 Size: ${urlTest.headers.get('Content-Length')} bytes`);
            
            return {
              success: true,
              downloadUrl: signedUrl,
              s3Info: {
                bucket: S3_BUCKET,
                key: `acta/${projectId}.${format}`,
                signedUrl
              }
            };
          } else {
            console.error(`❌ S3 signed URL not accessible: ${urlTest.status} ${urlTest.statusText}`);
            return {
              success: false,
              error: `S3 signed URL not accessible (${urlTest.status})`,
              downloadUrl: signedUrl // Return it anyway for debugging
            };
          }
        } catch (urlError) {
          console.error('❌ Error testing S3 signed URL:', urlError);
          return {
            success: false,
            error: 'Failed to verify S3 signed URL',
            downloadUrl: signedUrl // Return it anyway for debugging
          };
        }
      } else {
        console.error('❌ Missing Location header in 302 response');
        return {
          success: false,
          error: 'Missing S3 signed URL in response'
        };
      }
    } else if (response.status === 404) {
      console.log('📄 Document not found in S3 - may need to generate first');
      return {
        success: false,
        error: 'Document not found in S3 bucket'
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
        error: errorMessage
      };
    }
    
  } catch (error) {
    console.error('❌ Network error getting S3 download URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * Convert DOCX to PDF on-demand
 * This function retrieves the DOCX from S3 and converts it to PDF
 * More efficient than storing both formats in S3
 */
export async function convertDocxToPdf(projectId: string): Promise<{
  success: boolean;
  pdfUrl?: string;
  error?: string;
  conversionInfo?: {
    sourceDocx: string;
    pdfSize?: number;
    conversionTime?: number;
  };
}> {
  console.log(`📄→📕 Converting DOCX to PDF for project: ${projectId}`);
  console.log(`📦 Source: s3://${S3_BUCKET}/acta/${projectId}.docx`);
  
  try {
    const startTime = Date.now();
    
    // Call the PDF conversion API endpoint
    const response = await fetch(`${BASE}/convert-to-pdf/${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'manual'
    });
    
    const endTime = Date.now();
    const conversionTime = endTime - startTime;
    
    console.log(`📊 PDF conversion response: ${response.status} ${response.statusText}`);
    console.log(`⏱️ Conversion time: ${conversionTime}ms`);
    console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.status === 302) {
      // Successful conversion, get the PDF download URL
      const pdfUrl = response.headers.get('Location');
      
      if (pdfUrl) {
        console.log(`✅ PDF conversion successful: ${pdfUrl.substring(0, 100)}...`);
        
        // Verify the PDF URL is accessible
        try {
          const pdfTest = await fetch(pdfUrl, { method: 'HEAD' });
          const pdfSize = pdfTest.headers.get('Content-Length');
          
          if (pdfTest.ok) {
            console.log(`📄 PDF ready for download - Size: ${pdfSize} bytes`);
            
            return {
              success: true,
              pdfUrl,
              conversionInfo: {
                sourceDocx: `s3://${S3_BUCKET}/acta/${projectId}.docx`,
                pdfSize: pdfSize ? parseInt(pdfSize, 10) : undefined,
                conversionTime
              }
            };
          } else {
            console.error(`❌ PDF URL not accessible: ${pdfTest.status} ${pdfTest.statusText}`);
            return {
              success: false,
              error: `PDF not accessible (${pdfTest.status})`
            };
          }
        } catch (pdfError) {
          console.error('❌ Error testing PDF URL:', pdfError);
          return {
            success: false,
            error: 'Failed to verify PDF URL'
          };
        }
      } else {
        console.log('📄 DOCX signed URL is accessible, PDF conversion not requested');
        return {
          success: true,
          downloadUrl: signedUrl,
          s3Info: {
            bucket: S3_BUCKET,
            key: `acta/${projectId}.docx`,
            signedUrl
          }
        };
      }
    } catch (error) {
      console.error('❌ Network error getting S3 download URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  } catch (error) {
    console.error('❌ Error in S3 download process:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'S3 download failed'
    };
  }
}
