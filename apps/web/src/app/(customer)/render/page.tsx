'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';

function RenderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fabricId = searchParams.get('fabricId');
  const roomId = searchParams.get('roomId');
  const uploadUrl = searchParams.get('uploadUrl');
  const objectType = searchParams.get('objectType') || 'sofa';
  const sourceType = searchParams.get('sourceType') || 'predefined_room';

  const [status, setStatus] = useState('initializing');
  const [error, setError] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!fabricId || (!roomId && !uploadUrl)) {
      setError('Missing fabric or room information.');
      return;
    }

    async function startRender() {
      setStatus('starting');
      try {
        const data = await fetchApi<{ jobId: string }>('/api/renders', {
          method: 'POST',
          requireAuth: true,
          body: JSON.stringify({ fabricId, roomId, uploadUrl, objectType, sourceType }),
        });
        setJobId(data.jobId);
        setStatus('processing');
      } catch (err: any) {
        setError(err.message || 'Failed to start render');
        setStatus('error');
      }
    }
    startRender();
  }, [fabricId, roomId, uploadUrl, objectType, sourceType]);

  useEffect(() => {
    if (!jobId || status !== 'processing') return;

    let timeoutId: NodeJS.Timeout;

    async function pollStatus() {
      try {
        const data = await fetchApi<{ status: string; visualizationId?: string }>('/api/renders/' + jobId + '/status', { requireAuth: true });
        
        if (data.status === 'completed' && data.visualizationId) {
          setStatus('completed');
          router.replace(`/render/${data.visualizationId}`);
        } else if (data.status === 'failed') {
          setStatus('error');
          setError('Rendering failed. Please try again.');
        } else {
          // Continue polling
          timeoutId = setTimeout(pollStatus, 3000);
        }
      } catch (err) {
        console.error('Polling error', err);
        timeoutId = setTimeout(pollStatus, 3000);
      }
    }

    pollStatus();

    return () => clearTimeout(timeoutId);
  }, [jobId, status, router]);

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        <h2 className="text-xl font-bold">Oops! Something went wrong</h2>
        <p className="text-slate-500">{error}</p>
        <Button onClick={() => router.push('/rooms?fabricId=' + fabricId)} className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-blue-600">
          <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight animate-pulse">Visualizing...</h2>
      <p className="text-slate-500 mt-2">Applying fabric to your room</p>
      <p className="text-xs text-slate-400 mt-8">This usually takes about 30-45 seconds.</p>
    </div>
  );
}

export default function RenderPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Preparing...</div>}>
      <RenderContent />
    </Suspense>
  );
}
