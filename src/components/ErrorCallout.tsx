// src/components/ErrorCallout.tsx
import { AlertCircle, RefreshCw } from "lucide-react";
import React from "react";

interface ErrorCalloutProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  retryLoading?: boolean;
  className?: string;
}

export function ErrorCallout({
  title = "Something went wrong",
  message,
  onRetry,
  retryText = "Retry",
  retryLoading = false,
  className = "",
}: ErrorCalloutProps) {
  return (
    <div
      className={`backdrop-blur-xl bg-red-500/10 border border-red-400/20 rounded-2xl shadow-2xl ${className}`}
    >
      <div className="p-8">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-red-200 mb-2">{title}</h3>
            <p className="text-red-300/90 mb-6 leading-relaxed">{message}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                disabled={retryLoading}
                className="
                  inline-flex items-center gap-3 px-6 py-3
                  bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-sm
                  rounded-xl shadow-lg hover:shadow-xl
                  hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:ring-offset-2 focus:ring-offset-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-300 transform hover:scale-105 active:scale-95
                "
              >
                <RefreshCw
                  className={`h-4 w-4 ${retryLoading ? "animate-spin" : ""}`}
                />
                {retryLoading ? "Retrying..." : retryText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorCallout;
