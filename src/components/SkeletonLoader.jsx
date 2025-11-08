
import React from 'react';

export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 6 }) => (
  <div className="bg-white rounded-2xl shadow-sm border overflow-hidden animate-pulse">
    <table className="w-full">
      <thead className="bg-gray-50 border-b">
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="px-6 py-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <td key={colIndex} className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const SkeletonStats = () => (
  <div className="grid md:grid-cols-4 gap-4 animate-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border">
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    ))}
  </div>
);

const SkeletonLoader = {
  Card: SkeletonCard,
  Table: SkeletonTable,
  Stats: SkeletonStats
};

export default SkeletonLoader;
