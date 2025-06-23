// Dashboard.tsx — Build-safe version aligned with actaApi helpers
import { useState } from "react";
import ActaButtons from "../components/ActaButtons";
import {
  getDownloadUrl,
  sendApprovalEmail,
  extractProjectData,
} from "@/services/actaApi";

const DEFAULT_PROJECT_ID = "1000000064013473";        // TODO: replace later

export default function Dashboard() {
  const [projectId] = useState<string>(DEFAULT_PROJECT_ID);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ───────── handlers ───────── */
  const handleGenerate = async () => {
    try {
      setSubmitting(true);
      await extractProjectData(projectId);
    } catch {
      setError("Failed to extract project data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendForApproval = async () => {
    try {
      setSubmitting(true);
      await sendApprovalEmail({ actaId: projectId, clientEmail: "" });
    } catch {
      setError("Failed to send approval email");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadFile = async (fmt: "pdf" | "docx") => {
    try {
      setSubmitting(true);
      const res = await getDownloadUrl(projectId, fmt);
      window.location.href = res.data;       // triggers the download
    } catch {
      setError("Download failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ───────── render ───────── */
  if (error)
    return <div className="text-center py-16 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-white px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-semibold text-ikusi-green">
          Project Dashboard
        </h1>

        <p className="text-gray-500">Project ID: {projectId}</p>

        <ActaButtons
          onGenerate={handleGenerate}
          onSendForApproval={handleSendForApproval}
          onDownloadWord={() => downloadFile("docx")}
          onDownloadPdf={() => downloadFile("pdf")}
        />

        {submitting && (
          <p className="text-sm text-gray-400">Processing…</p>
        )}
      </div>
    </div>
  );
}
