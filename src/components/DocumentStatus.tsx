// src/components/DocumentStatus.tsx
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { checkDocumentAvailability } from '@/lib/api';

interface DocumentStatusProps {
  projectId: string;
  format: 'docx' | 'pdf';
  className?: string;
}

interface DocumentInfo {
  available: boolean;
  lastModified?: string;
  checking: boolean;
}

export default function DocumentStatus({
  projectId,
  format,
  className = '',
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
        const result = await checkDocumentAvailability(projectId, format);
        setDocInfo({
          available: result.available,
          lastModified: result.lastModified,
          checking: false,
        });
      } catch (error) {
        console.warn('Error checking document status:', error);
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
      return 'Checking...';
    }

    if (docInfo.available) {
      const date = docInfo.lastModified
        ? new Date(docInfo.lastModified).toLocaleDateString()
        : 'Available';
      return `Available${docInfo.lastModified ? ` (${date})` : ''}`;
    }

    return 'Not available';
  };

  const getStatusColor = () => {
    if (docInfo.checking) return 'text-yellow-600';
    if (docInfo.available) return 'text-green-600';
    return 'text-gray-500';
  };

  return (
    <div
      className={`flex items-center gap-2 text-sm ${getStatusColor()} ${className}`}
    >
      {getStatusIcon()}
      <span>
        {format.toUpperCase()}: {getStatusText()}
      </span>
    </div>
  );
}
