// src/utils/fetchProjects.ts
// CORS-resilient project fetching with JWT refresh retry logic

import { fetchAuthSession } from 'aws-amplify/auth';

import { Project } from '@/components/ProjectTable';
import { getProjectsByPM, PMProject } from '@/lib/api';

export interface FetchProjectsOptions {
  userEmail: string;
  isAdmin?: boolean;
}

/**
 * Resilient project fetching that handles CORS/network errors by:
 * 1. Attempting the initial API call
 * 2. If it fails with TypeError (network/CORS), refresh JWT and retry once
 * 3. Transform PMProject[] to Project[] for component compatibility
 */
export async function fetchProjects({
  userEmail,
  isAdmin = false,
}: FetchProjectsOptions): Promise<Project[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`📋 Fetching projects (attempt ${attempt}/2)...`);

      if (attempt === 2) {
        // Refresh JWT before retry
        console.log('🔄 Refreshing JWT session before retry...');
        await fetchAuthSession({ forceRefresh: true });
        console.log('✅ JWT session refreshed');
      }

      const projectSummaries = await getProjectsByPM(userEmail, isAdmin);
      console.log('✅ Projects loaded:', projectSummaries);

      // Transform PMProject[] to Project[]
      const projects: Project[] = projectSummaries.map((summary: PMProject, index: number) => ({
        id: parseInt(summary.id) || index + 1,
        name: summary.name || `Project ${summary.id}`,
        pm: summary.pm || 'Unknown',
        status: summary.status || 'Active',
      }));

      return projects;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`❌ Attempt ${attempt} failed:`, lastError);

      // Only retry on TypeError (network/CORS issues), not on other errors like 403/401
      if (attempt === 1 && err instanceof TypeError) {
        console.log('🔄 Network error detected, will retry with fresh JWT...');
        continue;
      }

      // Don't retry on non-network errors or if this is already the second attempt
      break;
    }
  }

  // If we get here, both attempts failed
  console.error('❌ All attempts failed, throwing last error');
  throw lastError;
}
