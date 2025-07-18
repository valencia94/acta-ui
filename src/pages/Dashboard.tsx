// src/pages/Dashboard.tsx - Clean unified dashboard
import { motion } from "framer-motion";
import { Download, FileText, Send } from "lucide-react";
import React, { lazy, Suspense, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import ActaButtons from "@/components/ActaButtons/ActaButtons";
import DynamoProjectsView from "@/components/DynamoProjectsView";
import { EmailInputDialog } from "@/components/EmailInputDialog";
import Header from "@/components/Header";
import ResponsiveIndicator from "@/components/ResponsiveIndicator";
import { useAuth } from "@/hooks/useAuth";
import {
  generateActaDocument,
  getDownloadUrl,
  sendApprovalEmail,
  checkDocumentAvailability,
  getProjectsByPM,
  getSummary,
  getTimeline,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/api-amplify";

// Lazy load PDF preview for better performance
const PDFPreview = lazy(() => import("@/components/PDFPreview"));

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  // PDF Preview state
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState<string>("");

  // Email dialog state
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState<string>("");

  // Initialize user data
  useEffect(() => {
    const initializeUser = async () => {
      if (user?.email) {
        try {
          const cognitoUser = await getCurrentUser();
          console.log("Cognito user initialized:", cognitoUser);
        } catch (error) {
          console.error("Error initializing Cognito user:", error);
        }
      }
    };

    initializeUser();
  }, [user]);

  // Handle project selection from DynamoProjectsView
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentProjectName(projectId);
    toast.success(`Selected project: ${projectId}`);
  };

  // Generate ACTA document
  const handleGenerateActa = async () => {
    if (!selectedProjectId) {
      toast.error("Please select a project first");
      return;
    }

    if (!user?.email) {
      toast.error("User email not available");
      return;
    }

    setActionLoading(true);
    try {
      await generateActaDocument(selectedProjectId, user.email, "pm");
      toast.success(
        "ACTA generation started – you\u2019ll get an e-mail when it\u2019s ready.",
      );
    } catch (error: any) {
      console.error("Error generating ACTA:", error);
      toast.error(error?.message || "Failed to generate ACTA");
    } finally {
      setActionLoading(false);
    }
  };

  // Download document
  const handleDownload = async (format: "pdf" | "docx") => {
    if (!selectedProjectId) {
      toast.error("Please select a project first");
      return;
    }

    setActionLoading(true);
    try {
      const url = await getDownloadUrl(selectedProjectId, format);
      window.open(url, "_blank");
    } catch (error: any) {
      console.error(`Error downloading ${format}:`, error);
      if (error?.message?.includes("404")) {
        toast.error("Document not ready, try Generate first.");
      } else {
        toast.error(
          error?.message || `Failed to download ${format.toUpperCase()}`,
        );
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Preview PDF
  const handlePreview = async () => {
    if (!selectedProjectId) {
      toast.error("Please select a project first");
      return;
    }

    setActionLoading(true);
    try {
      const check = await checkDocumentAvailability(selectedProjectId, "pdf");
      if (!check.available) {
        toast.error("Document not ready, try Generate first.");
        return;
      }
      const url = await getDownloadUrl(selectedProjectId, "pdf");
      setPdfPreviewUrl(url);
      setPdfPreviewFileName(`acta-${selectedProjectId}.pdf`);
    } catch (error: any) {
      console.error("Error previewing PDF:", error);
      toast.error(error?.message || "Failed to preview document");
    } finally {
      setActionLoading(false);
    }
  };

  // Send approval email
  const handleSendApproval = async (email: string) => {
    if (!selectedProjectId) {
      toast.error("Please select a project first");
      return;
    }

    setActionLoading(true);
    try {
      const result = await sendApprovalEmail(selectedProjectId, email);
      if (result.message) {
        toast.success("Approval email sent successfully!");
        setIsEmailDialogOpen(false);
      } else {
        toast.error("Failed to send approval email");
      }
    } catch (error: any) {
      console.error("Error sending approval email:", error);
      toast.error(error?.message || "Failed to send approval email");
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Welcome back, {user?.email || "User"}!
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Manage your projects and generate ACTA documents
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs sm:text-sm text-gray-500">
                Selected Project: {selectedProjectId || "None"}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8"
          data-testid="projects-section"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Your Projects
            </h2>
            <div className="text-xs sm:text-sm text-gray-500">
              Click on a project to select it
            </div>
          </div>

          <DynamoProjectsView
            userEmail={user?.email || ""}
            onProjectSelect={handleProjectSelect}
            selectedProjectId={selectedProjectId}
          />
        </motion.div>

        {/* Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              ACTA Actions
            </h2>
            <div className="text-xs sm:text-sm text-gray-500">
              {selectedProjectId
                ? `Project: ${selectedProjectId}`
                : "No project selected"}
            </div>
          </div>

          <ActaButtons
            onGenerate={handleGenerateActa}
            onDownloadPdf={() => handleDownload("pdf")}
            onDownloadWord={() => handleDownload("docx")}
            onPreviewPdf={handlePreview}
            onSendForApproval={() => setIsEmailDialogOpen(true)}
            disabled={!selectedProjectId || actionLoading}
          />
        </motion.div>
      </div>

      {/* PDF Preview Modal */}
      {pdfPreviewUrl && (
        <Suspense fallback={<div>Loading PDF...</div>}>
          <PDFPreview
            isOpen={!!pdfPreviewUrl}
            pdfUrl={pdfPreviewUrl}
            fileName={pdfPreviewFileName}
            onClose={() => setPdfPreviewUrl(null)}
          />
        </Suspense>
      )}

      {/* Email Dialog */}
      <EmailInputDialog
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        onSubmit={handleSendApproval}
        loading={actionLoading}
        title="Send Approval Request"
        description={`Send approval request for project: ${currentProjectName}`}
        placeholder="Enter client email address"
      />

      {/* Responsive Indicator (dev only) */}
      <ResponsiveIndicator />
    </div>
  );
}
