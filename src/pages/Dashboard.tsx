// Dashboard.tsx — Live-Ready Version with Dynamic ProjectID
import { useEffect, useState } from "react";
import ActaButtons from "../components/ActaButtons";
import {
  getProjectSummary,
  downloadActa,
  sendApprovalEmail,
  extractProjectPlaceData,
} from "@/services/actaApi";

export default function Dashboard() {
  const [projectId, setProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjectSummary()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProjectId(data[0].id || data[0].projectId || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = () => {
    extractProjectPlaceData(projectId);
  };

  const handleSendForApproval = () => {
    sendApprovalEmail(projectId);
  };

  const handleDownloadWord = () => {
    downloadActa(projectId, "word");
  };

  const handleDownloadPdf = () => {
    downloadActa(projectId, "pdf");
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading project info…</div>;
  }

  if (!projectId) {
    return <div className="text-center py-16 text-red-600">No project assigned or found.</div>;
  }

  return (
    <div className="min-h-screen bg-white px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-semibold text-ikusi-green">Project Dashboard</h1>
        <p className="text-gray-500">Project ID: {projectId}</p>
        <ActaButtons
          onGenerate={handleGenerate}
          onSendForApproval={handleSendForApproval}
          onDownloadWord={handleDownloadWord}
          onDownloadPdf={handleDownloadPdf}
        />
      </div>
    </div>
  );
}
