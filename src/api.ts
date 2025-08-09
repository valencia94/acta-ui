// src/api.ts
export {
  generateSummariesForPM,
  getProjectSummaryForPM,
  getPMProjectsWithSummary,
  getProjectsByPM,
  getAllProjects,
  generateActaDocument,
  getDownloadLink as getDownloadUrl, // preserve old name
  previewPdfBackend,
  checkDocumentInS3 as documentExists,
  sendApprovalEmail,
  getSummary,
  getTimeline,
} from "@/lib/api";
