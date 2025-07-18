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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-green-400 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-12 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-white/20 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-t-blue-400 border-r-purple-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <p className="text-white font-bold text-xl mb-2">Loading Dashboard</p>
              <p className="text-white/70">Preparing your workspace...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-br from-green-400 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-20 left-10 w-4 h-4 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-sm opacity-60"
        />
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 150, 0],
            rotate: [0, -180, -360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-40 right-20 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full opacity-40"
        />
        <motion.div
          animate={{
            x: [0, 200, 0],
            y: [0, -200, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-40 left-1/3 w-3 h-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-sm opacity-50"
        />
      </div>

      <Header />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Welcome Section - Modern Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOutCubic" }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8 mb-8 sm:mb-10 relative overflow-hidden"
        >
          {/* Subtle Internal Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent leading-tight"
              >
                Welcome back, {user?.email?.split('@')[0] || "User"}!
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-white/80 mt-2 text-sm sm:text-base font-medium"
              >
                Manage your projects and generate ACTA documents with ease
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center space-x-4"
            >
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-4 py-2">
                <div className="text-xs sm:text-sm text-white/90 font-medium">
                  Selected: {selectedProjectId ? (
                    <span className="text-green-300 font-semibold">{selectedProjectId}</span>
                  ) : (
                    <span className="text-orange-300">None</span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Projects Section - Enhanced Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOutCubic" }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8 mb-8 sm:mb-10 relative overflow-hidden"
        >
          {/* Animated Border Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-green-500/20 rounded-3xl opacity-50 animate-pulse"></div>
          <div className="absolute inset-0.5 backdrop-blur-xl bg-white/5 rounded-3xl"></div>
          
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-2">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent"
              >
                Your Projects
              </motion.h2>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-3 py-1"
              >
                <div className="text-xs sm:text-sm text-white/80 font-medium">
                  Click to select a project
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <DynamoProjectsView
                userEmail={user?.email || ""}
                onProjectSelect={handleProjectSelect}
                selectedProjectId={selectedProjectId}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Actions Section - Premium Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOutCubic" }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden"
        >
          {/* Dynamic Action Glow */}
          <motion.div 
            animate={{
              opacity: selectedProjectId ? [0.3, 0.6, 0.3] : [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`absolute inset-0 bg-gradient-to-r rounded-3xl ${
              selectedProjectId 
                ? "from-green-500/30 via-blue-500/30 to-purple-500/30" 
                : "from-gray-500/20 via-gray-600/20 to-gray-500/20"
            }`}
          ></motion.div>
          <div className="absolute inset-0.5 backdrop-blur-xl bg-white/5 rounded-3xl"></div>
          
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-2">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent"
              >
                ACTA Actions
              </motion.h2>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className={`backdrop-blur-md border rounded-full px-4 py-2 transition-all duration-300 ${
                  selectedProjectId 
                    ? "bg-green-500/20 border-green-400/30 text-green-200" 
                    : "bg-white/10 border-white/20 text-white/60"
                }`}
              >
                <div className="text-xs sm:text-sm font-medium">
                  {selectedProjectId
                    ? `✓ Project: ${selectedProjectId}`
                    : "⚠ No project selected"}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
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
