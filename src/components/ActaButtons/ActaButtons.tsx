// src/components/ActaButtons.tsx
import { Download, Eye, FileText, Send } from 'lucide-react';

import Button from '@/components/Button';

interface ActaButtonsProps {
  onGenerate: () => void;
  onDownloadWord: () => void;
  onDownloadPdf: () => void;
  onPreviewPdf?: () => void; // Optional PDF preview function
  onSendForApproval: () => void;
  disabled: boolean;
}

export default function ActaButtons({
  onGenerate,
  onDownloadWord,
  onDownloadPdf,
  onPreviewPdf,
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
    <div className="w-full max-w-3xl mx-auto">
      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Primary Actions Row */}
        <Button
          onClick={() => handleClick(onGenerate, 'Generate Acta')}
          disabled={disabled}
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
          <FileText className="h-4 w-4" />
          <span className="text-sm">Generate</span>
        </Button>

        <Button
          onClick={() => handleClick(onSendForApproval, 'Send for Approval')}
          disabled={disabled}
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
          <Send className="h-4 w-4" />
          <span className="text-sm">Send Approval</span>
        </Button>

        {/* Secondary Actions Row */}
        <Button
          onClick={() => handleClick(onDownloadWord, 'Download Word')}
          disabled={disabled}
          className="
            flex items-center justify-center gap-2.5
            bg-white hover:bg-green-50 
            border-2 border-green-200 hover:border-green-400
            text-green-700 hover:text-green-800 font-medium px-5 py-3 rounded-xl
            transition-all duration-300 ease-out
            focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400
            shadow-md hover:shadow-lg hover:-translate-y-0.5
            transform active:scale-95
            w-full h-14
          "
        >
          <Download className="h-4 w-4" />
          <span className="text-sm font-medium">Word</span>
        </Button>

        <Button
          onClick={() => handleClick(onDownloadPdf, 'Download PDF')}
          disabled={disabled}
          className="
            flex items-center justify-center gap-2.5
            bg-white hover:bg-teal-50
            border-2 border-teal-200 hover:border-teal-400
            text-teal-700 hover:text-teal-800 font-medium px-5 py-3 rounded-xl
            transition-all duration-300 ease-out
            focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400
            shadow-md hover:shadow-lg hover:-translate-y-0.5
            transform active:scale-95
            w-full h-14
          "
        >
          <Download className="h-4 w-4" />
          <span className="text-sm font-medium">PDF</span>
        </Button>
      </div>

      {/* PDF Preview Row - Centered */}
      {onPreviewPdf && (
        <div className="flex justify-center mt-3">
          <Button
            onClick={() => handleClick(onPreviewPdf, 'Preview PDF')}
            disabled={disabled}
            className="
              flex items-center justify-center gap-2.5
              bg-white hover:bg-purple-50
              border-2 border-purple-200 hover:border-purple-400
              text-purple-700 hover:text-purple-800 font-medium px-5 py-3 rounded-xl
              transition-all duration-300 ease-out
              focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400
              shadow-md hover:shadow-lg hover:-translate-y-0.5
              transform active:scale-95
              w-64 h-12
            "
          >
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">Preview PDF</span>
          </Button>
        </div>
      )}

      {/* Action Hint */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500 font-medium">
          Generate first, then download or send for approval
        </p>
      </div>
    </div>
  );
}
