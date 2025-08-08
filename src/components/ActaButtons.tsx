import { Download, Eye, FileText, Send } from "lucide-react";
import { useState } from "react";

import Button from "@/components/Button";
import {
  generateActaDocument,
  getDownloadLink,
  previewPdfBackend,
  previewPdfViaS3,
  sendApprovalEmail,
} from "@/lib/api";

interface ActaButtonsProps {
  project: { id: string };
  onPreviewOpen: (url: string) => void;
}

export default function ActaButtons({ project, onPreviewOpen }: ActaButtonsProps): JSX.Element {
  const [loading, setLoading] = useState<null | string>(null);

  const disabled = !project?.id || loading !== null;
  const isGenerating = loading === "generate";
  const isDownloadingWord = loading === "download-docx";
  const isDownloadingPdf = loading === "download-pdf";
  const isPreviewingPdf = loading === "preview";
  const isSendingApproval = loading === "email";

  const onGenerate = async () => {
    try {
      setLoading("generate");
      await generateActaDocument(project.id);
      console.log("ACTA generation started");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const onDownloadPdf = async () => {
    try {
      setLoading("download-pdf");
      const url = await getDownloadLink(project.id, "pdf");
      window.location.href = url;
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const onDownloadDocx = async () => {
    try {
      setLoading("download-docx");
      const url = await getDownloadLink(project.id, "docx");
      window.location.href = url;
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const onPreviewPdf = async () => {
    try {
      setLoading("preview");
      let url: string;
      try {
        url = await previewPdfBackend(project.id);
      } catch {
        url = await previewPdfViaS3(project.id);
      }
      onPreviewOpen(url);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const onSendEmail = async () => {
    try {
      setLoading("email");
      await sendApprovalEmail(project.id, "approvals@ikusi.com");
      console.log("Approval email sent");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Primary Actions Row */}
        <Button
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          className="
            flex items-center justify-center gap-2.5
            bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700
            text-white font-semibold px-5 py-3 rounded-xl
            transition-all duration-300 ease-out
            focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500
            shadow-lg hover:shadow-xl hover:-translate-y-0.5
            transform active:scale-95
            w-full h-14
            border border-green-400/20
          "
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span className="text-sm">Generating...</span>
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              <span className="text-sm">Generate</span>
            </>
          )}
        </Button>

        <Button
          onClick={onSendEmail}
          disabled={disabled || isSendingApproval}
          className="
            flex items-center justify-center gap-2.5
            bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700
            text-white font-semibold px-5 py-3 rounded-xl
            transition-all duration-300 ease-out
            focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500
            shadow-lg hover:shadow-xl hover:-translate-y-0.5
            transform active:scale-95
            w-full h-14
            border border-teal-400/20
          "
        >
          {isSendingApproval ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span className="text-sm">Sending...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span className="text-sm">Send Approval</span>
            </>
          )}
        </Button>
      </div>

      {/* Secondary Actions Row - 3 column grid */}
      <div className="grid grid-cols-3 gap-2 w-full mt-3">
        <Button
          onClick={onDownloadDocx}
          disabled={disabled || isDownloadingWord}
          className="
            flex items-center justify-center gap-2
            bg-white hover:bg-green-50
            border-2 border-green-200 hover:border-green-400
            text-green-700 hover:text-green-800 font-medium px-3 py-2.5 rounded-lg
            transition-all duration-300 ease-out
            focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400
            shadow-md hover:shadow-lg hover:-translate-y-0.5
            transform active:scale-95
            w-full h-12
          "
        >
          {isDownloadingWord ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-600 border-t-transparent"></div>
              <span className="text-xs font-medium">Loading...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span className="text-xs font-medium">Word</span>
            </>
          )}
        </Button>

        <Button
          onClick={onPreviewPdf}
          disabled={disabled || isPreviewingPdf}
          className="
            flex items-center justify-center gap-2
            bg-white hover:bg-blue-50
            border-2 border-blue-200 hover:border-blue-400
            text-blue-700 hover:text-blue-800 font-medium px-3 py-2.5 rounded-lg
            transition-all duration-300 ease-out
            focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400
            shadow-md hover:shadow-lg hover:-translate-y-0.5
            transform active:scale-95
            w-full h-12
          "
        >
          {isPreviewingPdf ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-xs font-medium">Loading...</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              <span className="text-xs font-medium">Preview</span>
            </>
          )}
        </Button>

        <Button
          onClick={onDownloadPdf}
          disabled={disabled || isDownloadingPdf}
          className="
            flex items-center justify-center gap-2
            bg-white hover:bg-teal-50
            border-2 border-teal-200 hover:border-teal-400
            text-teal-700 hover:text-teal-800 font-medium px-3 py-2.5 rounded-lg
            transition-all duration-300 ease-out
            focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400
            shadow-md hover:shadow-lg hover:-translate-y-0.5
            transform active:scale-95
            w-full h-12
          "
        >
          {isDownloadingPdf ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-teal-600 border-t-transparent"></div>
              <span className="text-xs font-medium">Loading...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span className="text-xs font-medium">PDF</span>
            </>
          )}
        </Button>
      </div>

      {/* Action Hint */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500 font-medium">
          Generate first, then preview, download or send for approval
        </p>
      </div>
    </div>
  );
}
