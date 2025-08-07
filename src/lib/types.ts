export interface Project {
  /* canonical */
  id: string;
  name: string;
  pm: string;
  pmEmail: string;
  status: string;
  lastUpdated: string;
  hasDocument: boolean;

  /* legacy aliases — keep optional */
  project_id?: string;
  pm_email?: string;
  lastModified?: string;
  metadata?: unknown;
}

export interface ProjectSummary {
  pm: string;
  pmEmail: string;
  status: string;
  documentCount: number;
  lastUpdated: string;

  /* aliases */
  pm_email?: string;
  lastModified?: string;
}

export type { ProjectSummary as ProjectSummaryType,Project as ProjectType };
