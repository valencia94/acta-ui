// src/api.ts
export {
  checkDocumentInS3 as documentExists,
  generateActaDocument,
  generateSummariesForPM,
  getAllProjects,
  getDownloadLink as getDownloadUrl, // preserve old name
  getPMProjectsWithSummary,
  getProjectsByPM,
  getProjectSummaryForPM,
  getSummary,
  getTimeline,
  previewPdfBackend,
  sendApprovalEmail,
} from "@/lib/api";
