import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin Error:', error);
  }, [error]);

  return (
    <div className="flex h-full w-full items-center justify-center p-12 text-center">
      <div className="space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Something went wrong!</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          An error occurred while loading the admin page. Please try again.
        </p>
        <Button onClick={() => reset()} variant="outline">
          Try again
        </Button>
      </div>
    </div>
  );
}
