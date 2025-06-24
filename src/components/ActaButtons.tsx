// src/components/ActaButtons.tsx
import { Download, FileText, Send } from 'lucide-react';

import { Button } from '@/components/Button';

interface ActaButtonsProps {
  onGenerate: () => void;
  onDownloadWord: () => void;
  onDownloadPdf: () => void;
  onSendForApproval: () => void;
}

export default function ActaButtons({
  onGenerate,
  onDownloadWord,
  onDownloadPdf,
  onSendForApproval,
}: ActaButtonsProps) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      <Button
        onClick={onGenerate}
        className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 text-white transition-transform hover:-translate-y-0.5"
      >
        <Download className="h-4 w-4" /> Generate Acta
      </Button>

      <Button
        onClick={onSendForApproval}
        className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 text-white transition-transform hover:-translate-y-0.5"
      >
        <Send className="h-4 w-4" /> Send for Approval
      </Button>

      <Button
        onClick={onDownloadWord}
        className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 transition-transform hover:-translate-y-0.5"
      >
        <FileText className="h-4 w-4" /> Download (.docx)
      </Button>

      <Button
        onClick={onDownloadPdf}
        className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 transition-transform hover:-translate-y-0.5"
      >
        <FileText className="h-4 w-4" /> Download (.pdf)
      </Button>
    </div>
  );
}
