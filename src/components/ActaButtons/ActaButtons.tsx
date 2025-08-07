// src/components/ActaButtons.tsx
import { Download, Eye, Send, Zap } from 'lucide-react';

import Button from '@/components/Button';

export interface ActaButtonsProps {
  onGenerate: () => Promise<void>;
  onDownloadWord: () => Promise<void>;
  onDownloadPdf: () => Promise<void>;
  onPreviewPdf: () => Promise<void>;
  onSendForApproval: () => void;
  disabled: boolean;
  isGenerating: boolean;
}

export default function ActaButtons({
  onGenerate,
  onDownloadWord,
  onDownloadPdf,
  onPreviewPdf,
  onSendForApproval,
  disabled,
  isGenerating,
}: ActaButtonsProps): JSX.Element {
  const handleClick = (action: () => Promise<void> | void, _actionName: string) => {
    if (disabled) return;
    void action();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        <Button
          type="button"
          aria-label="Generate ACTA document"
          onClick={() => handleClick(onGenerate, 'Generate Acta')}
          disabled={disabled}
          className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold px-4 sm:px-5 py-3 rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform active:scale-95 w-full h-12 sm:h-14 border border-green-400/20"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span className="text-sm">Generating...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 text-yellow-300" />
              <span className="text-sm">Generate</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          aria-label="Send document for approval"
          onClick={() => handleClick(onSendForApproval, 'Send for Approval')}
          disabled={disabled}
          className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold px-4 sm:px-5 py-3 rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform active:scale-95 w-full h-12 sm:h-14 border border-teal-400/20"
        >
          <Send className="h-4 w-4" />
          <span className="text-sm">Send Approval</span>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 w-full mt-3">
        <Button
          type="button"
          aria-label="Download Word document"
          onClick={() => handleClick(onDownloadWord, 'Download Word')}
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white border-2 border-green-200 text-green-700 font-medium px-2 sm:px-3 py-2.5 rounded-lg transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:bg-green-50 hover:border-green-400 hover:text-green-800 hover:shadow-lg hover:-translate-y-0.5 transform active:scale-95 w-full h-10 sm:h-12"
        >
          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-xs font-medium hidden sm:inline">Word</span>
          <span className="text-xs font-medium sm:hidden">Doc</span>
        </Button>

        <Button
          type="button"
          aria-label="Preview PDF document"
          onClick={() => handleClick(onPreviewPdf, 'Preview PDF')}
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white border-2 border-blue-200 text-blue-700 font-medium px-2 sm:px-3 py-2.5 rounded-lg transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:bg-blue-50 hover:border-blue-400 hover:text-blue-800 hover:shadow-lg hover:-translate-y-0.5 transform active:scale-95 w-full h-10 sm:h-12"
        >
          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-xs font-medium">Preview</span>
        </Button>

        <Button
          type="button"
          aria-label="Download PDF document"
          onClick={() => handleClick(onDownloadPdf, 'Download PDF')}
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white border-2 border-teal-200 text-teal-700 font-medium px-2 sm:px-3 py-2.5 rounded-lg transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:bg-teal-50 hover:border-teal-400 hover:text-teal-800 hover:shadow-lg hover:-translate-y-0.5 transform active:scale-95 w-full h-10 sm:h-12"
        >
          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-xs font-medium">PDF</span>
        </Button>
      </div>

      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500 font-medium">
          {disabled
            ? 'Select a project to enable ACTA actions'
            : 'Generate first, then preview, download or send for approval'}
        </p>
      </div>
    </div>
  );
}
