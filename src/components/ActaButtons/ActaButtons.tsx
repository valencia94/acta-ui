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
  isDownloadingWord?: boolean;
  isDownloadingPdf?: boolean;
  isPreviewingPdf?: boolean;
  isSendingApproval?: boolean;
  compact?: boolean; // New prop for compact horizontal layout
}

export default function ActaButtons({
  onGenerate,
  onDownloadWord,
  onDownloadPdf,
  onPreviewPdf,
  onSendForApproval,
  disabled,
  isGenerating,
  isDownloadingWord = false,
  isDownloadingPdf = false,
  isPreviewingPdf = false,
  isSendingApproval = false,
  compact = false,
}: ActaButtonsProps): JSX.Element {
  const handleClick = (action: () => Promise<void> | void, _actionName: string) => {
    if (disabled) return;
    void action();
  };

  if (compact) {
    // Compact horizontal layout for sticky panel
    return (
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          aria-label="Generate ACTA document"
          onClick={() => handleClick(onGenerate, 'Generate Acta')}
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold px-3 py-2 rounded-lg transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5 transform active:scale-95 h-9 border border-green-400/20"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
              <span className="text-xs">Generating...</span>
            </>
          ) : (
            <>
              <Zap className="h-3 w-3 text-yellow-300" />
              <span className="text-xs">Generate</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          aria-label="Download Word document"
          onClick={() => handleClick(onDownloadWord, 'Download Word')}
          disabled={disabled || isDownloadingWord}
          className="flex items-center justify-center gap-1 bg-white border border-green-200 text-green-700 font-medium px-2.5 py-2 rounded-lg transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:bg-green-50 hover:border-green-400 hover:text-green-800 hover:shadow-md hover:-translate-y-0.5 transform active:scale-95 h-9"
        >
          {isDownloadingWord ? (
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-600 border-t-transparent"></div>
          ) : (
            <>
              <Download className="h-3 w-3" />
              <span className="text-xs hidden sm:inline">Word</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          aria-label="Preview PDF document"
          onClick={() => handleClick(onPreviewPdf, 'Preview PDF')}
          disabled={disabled || isPreviewingPdf}
          className="flex items-center justify-center gap-1 bg-white border border-blue-200 text-blue-700 font-medium px-2.5 py-2 rounded-lg transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:bg-blue-50 hover:border-blue-400 hover:text-blue-800 hover:shadow-md hover:-translate-y-0.5 transform active:scale-95 h-9"
        >
          {isPreviewingPdf ? (
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
          ) : (
            <>
              <Eye className="h-3 w-3" />
              <span className="text-xs hidden sm:inline">Preview</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          aria-label="Download PDF document"
          onClick={() => handleClick(onDownloadPdf, 'Download PDF')}
          disabled={disabled || isDownloadingPdf}
          className="flex items-center justify-center gap-1 bg-white border border-teal-200 text-teal-700 font-medium px-2.5 py-2 rounded-lg transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:bg-teal-50 hover:border-teal-400 hover:text-teal-800 hover:shadow-md hover:-translate-y-0.5 transform active:scale-95 h-9"
        >
          {isDownloadingPdf ? (
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-teal-600 border-t-transparent"></div>
          ) : (
            <>
              <Download className="h-3 w-3" />
              <span className="text-xs hidden sm:inline">PDF</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          aria-label="Send document for approval"
          onClick={() => handleClick(onSendForApproval, 'Send for Approval')}
          disabled={disabled || isSendingApproval}
          className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold px-3 py-2 rounded-lg transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:-translate-y-0.5 transform active:scale-95 h-9 border border-teal-400/20"
        >
          {isSendingApproval ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
              <span className="text-xs">Sending...</span>
            </>
          ) : (
            <>
              <Send className="h-3 w-3" />
              <span className="text-xs hidden sm:inline">Send</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  // Original layout for non-compact usage

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
          disabled={disabled || isSendingApproval}
          className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold px-4 sm:px-5 py-3 rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform active:scale-95 w-full h-12 sm:h-14 border border-teal-400/20"
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

      <div className="grid grid-cols-3 gap-2 w-full mt-3">
        <Button
          type="button"
          aria-label="Download Word document"
          onClick={() => handleClick(onDownloadWord, 'Download Word')}
          disabled={disabled || isDownloadingWord}
          className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white border-2 border-green-200 text-green-700 font-medium px-2 sm:px-3 py-2.5 rounded-lg transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:bg-green-50 hover:border-green-400 hover:text-green-800 hover:shadow-lg hover:-translate-y-0.5 transform active:scale-95 w-full h-10 sm:h-12"
        >
          {isDownloadingWord ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-600 border-t-transparent"></div>
              <span className="text-xs font-medium hidden sm:inline">Loading...</span>
            </>
          ) : (
            <>
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs font-medium hidden sm:inline">Word</span>
              <span className="text-xs font-medium sm:hidden">Doc</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          aria-label="Preview PDF document"
          onClick={() => handleClick(onPreviewPdf, 'Preview PDF')}
          disabled={disabled || isPreviewingPdf}
          className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white border-2 border-blue-200 text-blue-700 font-medium px-2 sm:px-3 py-2.5 rounded-lg transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:bg-blue-50 hover:border-blue-400 hover:text-blue-800 hover:shadow-lg hover:-translate-y-0.5 transform active:scale-95 w-full h-10 sm:h-12"
        >
          {isPreviewingPdf ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-xs font-medium">Loading...</span>
            </>
          ) : (
            <>
              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs font-medium">Preview</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          aria-label="Download PDF document"
          onClick={() => handleClick(onDownloadPdf, 'Download PDF')}
          disabled={disabled || isDownloadingPdf}
          className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white border-2 border-teal-200 text-teal-700 font-medium px-2 sm:px-3 py-2.5 rounded-lg transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:bg-teal-50 hover:border-teal-400 hover:text-teal-800 hover:shadow-lg hover:-translate-y-0.5 transform active:scale-95 w-full h-10 sm:h-12"
        >
          {isDownloadingPdf ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-teal-600 border-t-transparent"></div>
              <span className="text-xs font-medium">Loading...</span>
            </>
          ) : (
            <>
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs font-medium">PDF</span>
            </>
          )}
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
