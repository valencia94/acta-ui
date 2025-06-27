// src/components/ActaButtons.tsx
import { Download, FileText, Send } from 'lucide-react';

import Button from '@/components/Button';

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
  const handleClick = (action: () => void, actionName: string) => {
    if (disabled) {
      console.log(`${actionName} clicked but disabled`);
      return;
    }
    console.log(`${actionName} clicked`);
    action();
  };

  return (
    <div className="flex flex-wrap gap-3">
      {/* Generate Acta */}
      <Button
        onClick={() => handleClick(onGenerate, 'Generate Acta')}
        disabled={disabled}
        className="
          flex items-center justify-center gap-2
          bg-green-500 hover:bg-green-600 focus:ring-green-300
          text-white font-medium px-4 py-2 rounded-xl
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-lg hover:shadow-xl
        "
      >
        <FileText className="h-4 w-4" />
        Generate
      </Button>

      {/* Send for Approval */}
      <Button
        onClick={() => handleClick(onSendForApproval, 'Send for Approval')}
        disabled={disabled}
        className="
          flex items-center justify-center gap-2
          bg-teal-500 hover:bg-teal-600 focus:ring-teal-300
          text-white font-medium px-4 py-2 rounded-xl
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-lg hover:shadow-xl
        "
      >
        <Send className="h-4 w-4" />
        Send Approval
      </Button>

      {/* Download (.docx) */}
      <Button
        onClick={() => handleClick(onDownloadWord, 'Download Word')}
        disabled={disabled}
        className="
          flex items-center justify-center gap-2
          bg-white border-2 border-green-300 hover:border-green-500 
          text-green-600 hover:text-green-700 font-medium px-4 py-2 rounded-xl
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-md hover:shadow-lg
        "
      >
        <Download className="h-4 w-4" />
        Word
      </Button>

      {/* Download (.pdf) */}
      <Button
        onClick={() => handleClick(onDownloadPdf, 'Download PDF')}
        disabled={disabled}
        className="
          flex items-center justify-center gap-2
          bg-white border-2 border-teal-300 hover:border-teal-500
          text-teal-600 hover:text-teal-700 font-medium px-4 py-2 rounded-xl
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-md hover:shadow-lg
        "
      >
        <Download className="h-4 w-4" />
        PDF
      </Button>
    </div>
  );
}
