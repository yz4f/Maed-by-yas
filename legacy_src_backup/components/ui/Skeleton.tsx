import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
}

export function Skeleton({ className = '', width, height, rounded = 'rounded-md' }: SkeletonProps) {
  const style = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return (
    <div
      className={`skeleton bg-gray-800/50 ${rounded} ${className}`}
      style={style}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex flex-col gap-4">
      <Skeleton height="150px" rounded="rounded-lg" className="w-full" />
      <div className="space-y-2">
        <Skeleton height="20px" width="70%" />
        <Skeleton height="16px" width="100%" />
        <Skeleton height="16px" width="40%" />
      </div>
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTable({ rows = 5, cols = 4 }: SkeletonTableProps) {
  return (
    <div className="w-full bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
      <div className="grid border-b border-gray-800 bg-gray-900/80 p-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="20px" width="60%" />
        ))}
      </div>
      <div className="divide-y divide-gray-800">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid p-4 gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <Skeleton key={colIndex} height="16px" width={colIndex === 0 ? "80%" : "50%"} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
