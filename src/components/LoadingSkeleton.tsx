// src/components/LoadingSkeleton.tsx
import React from "react";

interface SkeletonRowProps {
  className?: string;
}

export function SkeletonRow({ className = "" }: SkeletonRowProps) {
  return (
    <tr className={`animate-pulse ${className}`}>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-12"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      </td>
    </tr>
  );
}

interface ProjectSkeletonProps {
  rows?: number;
}

export function ProjectTableSkeleton({ rows = 3 }: ProjectSkeletonProps) {
  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="animate-pulse">
            <div className="h-6 bg-gradient-to-r from-white/20 via-white/30 to-white/20 rounded-lg w-32 mb-2"></div>
            <div className="h-4 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-lg w-48"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-4 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-full w-24"></div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="rounded-2xl overflow-hidden backdrop-blur-md bg-white/5 border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="backdrop-blur-md bg-white/10 border-b border-white/10">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left font-bold text-white/60 hidden sm:table-cell">
                  ID
                </th>
                <th className="px-4 sm:px-6 py-4 text-left font-bold text-white/60">
                  Name
                </th>
                <th className="px-4 sm:px-6 py-4 text-left font-bold text-white/60 hidden md:table-cell">
                  PM
                </th>
                <th className="px-4 sm:px-6 py-4 text-left font-bold text-white/60">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {Array.from({ length: rows }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                    <div className="h-4 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded w-12"></div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="h-4 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded w-24 sm:w-32"></div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                    <div className="h-4 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded w-20 sm:w-24"></div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="h-6 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-full w-16"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className = "" }: CardSkeletonProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm p-6 border border-gray-200 animate-pulse ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export default ProjectTableSkeleton;
