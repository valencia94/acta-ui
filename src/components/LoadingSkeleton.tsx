// src/components/LoadingSkeleton.tsx
import React from 'react';

interface SkeletonRowProps {
  className?: string;
}

export function SkeletonRow({ className = '' }: SkeletonRowProps): JSX.Element {
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

export function ProjectTableSkeleton({ rows = 3 }: ProjectSkeletonProps): JSX.Element {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="animate-pulse">
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="rounded-2xl shadow-lg overflow-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-white sticky top-0">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left font-semibold hidden sm:table-cell">
                  ID
                </th>
                <th className="px-4 sm:px-6 py-3 text-left font-semibold">Name</th>
                <th className="px-4 sm:px-6 py-3 text-left font-semibold hidden md:table-cell">
                  PM
                </th>
                <th className="px-4 sm:px-6 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: rows }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-24 sm:w-32"></div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                    <div className="h-4 bg-gray-200 rounded w-20 sm:w-24"></div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
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

export function CardSkeleton({ className = '' }: CardSkeletonProps): JSX.Element {
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
