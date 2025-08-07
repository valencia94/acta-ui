// src/components/ErrorCallout.tsx
import { AlertCircle, RefreshCw } from 'lucide-react';
import React from 'react';

interface ErrorCalloutProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  retryLoading?: boolean;
  className?: string;
}

export function ErrorCallout({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Retry',
  retryLoading = false,
  className = '',
}: ErrorCalloutProps): JSX.Element {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-red-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-red-900 mb-1">{title}</h3>
            <p className="text-red-700 mb-4">{message}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                disabled={retryLoading}
                className="
                  inline-flex items-center gap-2 px-4 py-2
                  bg-red-600 text-white font-medium text-sm
                  rounded-lg shadow-sm
                  hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200
                "
              >
                <RefreshCw className={`h-4 w-4 ${retryLoading ? 'animate-spin' : ''}`} />
                {retryLoading ? 'Retrying...' : retryText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorCallout;
