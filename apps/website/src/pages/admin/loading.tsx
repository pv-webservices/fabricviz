import React from 'react';

export default function AdminLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center p-12">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
        <p className="text-sm font-medium text-slate-500">Loading...</p>
      </div>
    </div>
  );
}
