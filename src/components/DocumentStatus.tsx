// src/components/DocumentStatus.tsx
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";


import { checkDocumentInS3 } from "@/lib/api";

interface DocumentStatusProps {
  projectId: string;
  format: "docx" | "pdf";
  className?: string;
}

interface DocumentInfo {
  available: boolean;
  lastModified?: string;
  size?: number;
  checking: boolean;
  s3Key?: string;
}

export default function DocumentStatus({
  projectId,
  format,
  className = "",
}: DocumentStatusProps) {
  const [docInfo, setDocInfo] = useState<DocumentInfo>({
    available: false,
    checking: false,
  });

  useEffect(() => {
    if (!projectId.trim()) {
      setDocInfo({ available: false, checking: false });
      return;
    }

    const checkAvailability = async () => {
      setDocInfo((prev) => ({ ...prev, checking: true }));

      try {
        const result = await checkDocumentInS3(projectId, format);
        setDocInfo({
          available: result.available,
          lastModified: result.lastModified,
          size: result.size,
          s3Key: result.s3Key,
          checking: false,
        });
      } catch (error) {
        console.warn("Error checking document status in S3:", error);
        setDocInfo({ available: false, checking: false });
      }
    };

    checkAvailability();
  }, [projectId, format]);

  const getStatusIcon = () => {
    if (docInfo.checking) {
      return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
    }

    if (docInfo.available) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }

    return <XCircle className="h-4 w-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (docInfo.checking) {
      return "Checking S3...";
    }

    if (docInfo.available) {
      const parts = [];

      if (docInfo.size) {
        const sizeStr =
          docInfo.size < 1024
            ? `${docInfo.size} B`
            : docInfo.size < 1024 * 1024
              ? `${(docInfo.size / 1024).toFixed(1)} KB`
              : `${(docInfo.size / (1024 * 1024)).toFixed(1)} MB`;
        parts.push(sizeStr);
      }

      if (docInfo.lastModified) {
        const date = new Date(docInfo.lastModified).toLocaleDateString();
        parts.push(date);
      }

      return `Available in S3${parts.length ? " (" + parts.join(", ") + ")" : ""}`;
    }

    return "Not found in S3";
  };

  const getStatusColor = () => {
    if (docInfo.checking) return "text-yellow-600";
    if (docInfo.available) return "text-green-600";
    return "text-gray-500";
  };

  return (
    <div
      className={`flex flex-col gap-1 text-sm ${getStatusColor()} ${className}`}
    >
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span>
          {format.toUpperCase()}: {getStatusText()}
        </span>
      </div>
      {docInfo.available && docInfo.s3Key && (
        <div className="text-xs text-gray-500 ml-6">
          S3: projectplace-dv-2025-x9a7b/{docInfo.s3Key}
        </div>
      )}
    </div>
  );
}
