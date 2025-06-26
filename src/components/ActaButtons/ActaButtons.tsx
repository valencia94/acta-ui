// src/components/ActaButtons.tsx
import { Download, FileText, Send } from 'lucide-react';
import { Button } from '@/components/Button';

interface ActaButtonsProps {
  onGenerate: () => void;
  onDownloadWord: () => void;
  onDownloadPdf: () => void;
  onSendForApproval: () => void;
  disabled: boolean;
}

export default function ActaButtons({
  onGenerate,
  onDownloadWord,
  onDownloadPdf,
  onSendForApproval,
  disabled,
}: ActaButtonsProps) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Generate Acta */}
      <Button
        onClick={onGenerate}
        disabled={disabled}
        className="
          flex items-center justify-center gap-2
          bg-primary hover:bg-accent focus:ring-primary
          rounded-xl
          transition-transform
          py-2 text-white
          focus:outline-none focus:ring-2 focus:ring-offset-2
        "
      >
        <Download className="h-5 w-5" />
        Generate Acta
      </Button>

      {/* Send for Approval */}
      <Button
        onClick={onSendForApproval}
        disabled={disabled}
        className="
          flex items-center justify-center gap-2
          bg-primary hover:bg-accent focus:ring-primary
          rounded-xl
          transition-transform
          py-2 text-white
          focus:outline-none focus:ring-2 focus:ring-offset-2
        "
      >
        <Send className="h-5 w-5" />
        Send for Approval
      </Button>

      {/* Download (.docx) */}
      <Button
        onClick={onDownloadWord}
        disabled={disabled}
        className="
          flex items-center justify-center gap-2
          border border-secondary hover:border-accent focus:ring-secondary
          rounded-xl
          transition-transform
          py-2
          focus:outline-none focus:ring-2 focus:ring-offset-2
        "
      >
        <FileText className="h-5 w-5" />
        Download (.docx)
      </Button>

      {/* Download (.pdf) */}
      <Button
        onClick={onDownloadPdf}
        disabled={disabled}
        className="
          flex items-center justify-center gap-2
          border border-secondary hover:border-accent focus:ring-secondary
          rounded-xl
          transition-transform
          py-2
          focus:outline-none focus:ring-2 focus:ring-offset-2
        "
      >
        <FileText className="h-5 w-5" />
        Download (.pdf)
      </Button>
    </div>
  );
}
