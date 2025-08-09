// src/components/ErrorHandling/CorsErrorBanner.tsx
// Friendly banner for CORS/credentials issues with retry functionality

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface CorsErrorBannerProps {
  error: Error;
  url?: string;
  region?: string;
  onRetry: () => void;
  onDismiss?: () => void;
}

export function CorsErrorBanner({ 
  error, 
  url, 
  region,
  onRetry, 
  onDismiss 
}: CorsErrorBannerProps): JSX.Element | null {
  const [isRetrying, setIsRetrying] = useState(false);

  const isCorsError = error.message.includes('Failed to fetch') || 
                     error.message.includes('CORS') ||
                     error.message.includes('Network request failed');

  const handleRetry = async (): Promise<void> => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  // Log detailed error info to DevTools for debugging
  console.error('[ACTA CORS Debug]', {
    errorMessage: error.message,
    attemptedUrl: url,
    region: region,
    errorType: error.constructor.name,
    timestamp: new Date().toISOString(),
  });

  if (!isCorsError) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-lg mb-4">
      <div className="flex items-start">
        <div className="text-red-400 mr-3">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            Connection Issue - Likely CORS/Credentials Problem
          </h3>
          <div className="text-sm text-red-700 space-y-2">
            <p>
              The request failed, which often indicates CORS (Cross-Origin Resource Sharing) 
              or authentication credentials issues.
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-red-600 hover:text-red-800 font-medium">
                Technical Details (for developers)
              </summary>
              <div className="mt-2 p-3 bg-red-100 rounded text-xs font-mono space-y-1">
                <div><strong>Error:</strong> {error.message}</div>
                {url && <div><strong>URL:</strong> {url}</div>}
                {region && <div><strong>Region:</strong> {region}</div>}
                <div><strong>Time:</strong> {new Date().toLocaleString()}</div>
              </div>
            </details>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => void handleRetry()}
              disabled={isRetrying}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isRetrying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent mr-2"></div>
                  Retrying (SigV4)...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry (SigV4)
                </>
              )}
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 transition-colors duration-200"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}