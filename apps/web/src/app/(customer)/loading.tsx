import React from 'react';

export default function CustomerLoading() {
  return (
    <div className="flex flex-col h-full w-full p-4 space-y-4">
      <div className="w-1/2 h-8 bg-slate-200 rounded animate-pulse mb-4"></div>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="aspect-square bg-slate-200 rounded-xl animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}
