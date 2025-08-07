export interface ProjectSummary {
  project_id: string;
  project_name: string;
  pm?: string;
  pm_email?: string;
  project_manager?: string;
  acta_last_generated?: string;
  status?: string;
  [k: string]: unknown;
}

export interface PMProject {
  id: string | number;
  name: string;
  pm: string;
  status: string;
  project_id: string;
  project_name: string;
  pm_email?: string;
  project_manager?: string;
  [key: string]: unknown;
}

export interface BulkGenerationResult {
  success: ProjectSummary[];
  failed: string[];
}