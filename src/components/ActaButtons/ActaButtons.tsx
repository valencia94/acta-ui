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
}: ActaButtonsProps): JSX.Element {
  const handleClick = (action: () => Promise<void> | void, _actionName: string) => {
    if (disabled) return;
    void action();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <Button
          type="button"
          aria-label="Generate ACTA document"
          onClick={() => handleClick(onGenerate, 'Generate Acta')}
          disabled={disabled}
          className="flex items-center justify-center gap-2.5 bg-accent text-white font-medium px-4 py-2 min-h-10 rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:bg-accent-hover hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 w-full"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span className="text-sm">GENERATING...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">GENERATE</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          aria-label="Send document for approval"
          onClick={() => handleClick(onSendForApproval, 'Send for Approval')}
          disabled={disabled || isSendingApproval}
          className="flex items-center justify-center gap-2.5 bg-white text-accent border border-accent font-medium px-4 py-2 min-h-10 rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:bg-accent hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 w-full"
        >
          {isSendingApproval ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent"></div>
              <span className="text-sm">SENDING...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span className="text-sm font-medium">SEND APPROVAL</span>
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full mt-4">
        <Button
          type="button"
          aria-label="Download Word document"
          onClick={() => handleClick(onDownloadWord, 'Download Word')}
          disabled={disabled || isDownloadingWord}
          className="flex items-center justify-center gap-1.5 bg-white border border-borders text-body font-medium px-2 py-2 min-h-10 rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:border-accent hover:bg-accent hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 w-full"
        >
          {isDownloadingWord ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-accent border-t-transparent"></div>
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
          className="flex items-center justify-center gap-1.5 bg-white border border-borders text-body font-medium px-2 py-2 min-h-10 rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:border-accent hover:bg-accent hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 w-full"
        >
          {isPreviewingPdf ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-accent border-t-transparent"></div>
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
          className="flex items-center justify-center gap-1.5 bg-white border border-borders text-body font-medium px-2 py-2 min-h-10 rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:border-accent hover:bg-accent hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 w-full"
        >
          {isDownloadingPdf ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-accent border-t-transparent"></div>
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

      <div className="mt-4 text-center">
        <p className="text-xs text-muted font-medium">
          {disabled
            ? 'Select a project to enable ACTA actions'
            : 'Generate first, then preview, download or send for approval'}
        </p>
      </div>
    </div>
  );
}
