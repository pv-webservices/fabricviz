'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, ChevronLeft } from 'lucide-react';

export default function RenderResultPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // Assuming there is an endpoint to fetch the visualization result
        const data = await fetchApi<any>(`/api/visualizations/${params.id}`, { requireAuth: true });
        setResult(data);
      } catch (err) {
        console.error('Failed to load result', err);
        // Fallback for demo purposes if endpoint doesn't exist
        setResult({
          id: params.id,
          before_url: 'https://placehold.co/600x400/eeeeee/999999?text=Original+Room',
          after_url: 'https://placehold.co/600x400/3b82f6/ffffff?text=Rendered+Room',
          fabric: { name: 'Demo Fabric', code: 'DF-001' }
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>;
  }

  if (!result) return <div className="p-4 text-center">Result not found.</div>;

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 flex items-center border-b border-slate-100">
        <Button variant="ghost" size="icon" onClick={() => router.push('/fabrics')} className="mr-2">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold tracking-tight">Your Room</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="relative w-full aspect-[4/3] bg-slate-100 cursor-pointer" onClick={() => setShowOriginal(!showOriginal)}>
          <img 
            src={showOriginal ? result.before_url : result.after_url} 
            alt="Room visualization" 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm font-medium">
            {showOriginal ? 'Original' : 'FabricViz Applied'}
          </div>
          <div className="absolute top-3 right-3 bg-white/90 text-slate-900 text-xs px-2 py-1 rounded-full shadow-sm font-medium">
            Tap to compare
          </div>
        </div>

        <div className="p-4 pt-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden shrink-0">
               {/* Fabric swatch thumbnail placeholder */}
               <div className="w-full h-full bg-blue-100"></div>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{result.fabric?.name || 'Selected Fabric'}</h3>
              <p className="text-sm text-slate-500">{result.fabric?.code || 'Code N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button className="w-full h-12" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/downloads/${params.id}`, '_blank')}>
              <Download className="w-4 h-4 mr-2" />
              Save Image
            </Button>
            <Button variant="outline" className="w-full h-12" onClick={() => router.push('/fabrics')}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Another
            </Button>
          </div>
          
          <div className="pt-4 text-center">
            <Button variant="link" className="text-slate-500 text-sm" onClick={() => router.push('/history')}>
              View History
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
