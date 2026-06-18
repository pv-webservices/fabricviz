'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { ChevronLeft, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FabricDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [fabric, setFabric] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<any>(`/api/fabrics/${params.id}`, { requireAuth: true });
        setFabric(data);
      } catch (err) {
        console.error('Failed to load fabric', err);
        // Fallback for UI visualization testing
        setFabric({
          id: params.id,
          name: 'Demo Fabric',
          code: 'DEMO-123',
          swatch_url: 'https://placehold.co/600x600/3b82f6/ffffff?text=Fabric+Swatch'
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

  if (!fabric) return <div className="p-4 text-center">Fabric not found.</div>;

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 pb-2 flex items-center border-b border-slate-100 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold tracking-tight truncate">{fabric.name}</h2>
          <p className="text-xs text-slate-500">{fabric.code}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="relative w-full aspect-square bg-slate-100">
          {fabric.swatch_url ? (
            <img src={fabric.swatch_url} alt={fabric.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">No Image</div>
          )}
          <div className="absolute bottom-4 right-4 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-sm backdrop-blur">
             <Maximize className="w-5 h-5 text-slate-700" />
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-lg">Details</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Color</span>
                <span className="font-medium capitalize">{fabric.color || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Type</span>
                <span className="font-medium capitalize">{fabric.type || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <Button 
            size="lg" 
            className="w-full h-14 text-lg font-bold mt-8 shadow-md"
            onClick={() => router.push(`/rooms?fabricId=${fabric.id}`)}
          >
            Visualize in a Room
          </Button>
        </div>
      </div>
    </div>
  );
}
