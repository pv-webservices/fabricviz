'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CollectionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [collection, setCollection] = useState<any>(null);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch fabrics specifically for this collection
        const fabricsData = await fetchApi<{ items: any[] }>(`/api/collections/${params.id}/fabrics`, { requireAuth: true });
        setFabrics(fabricsData.items);

        // Fetch collection details (fallback to matching from the fabrics list or API)
        try {
          const colData = await fetchApi<any>(`/api/collections/${params.id}`, { requireAuth: true });
          setCollection(colData);
        } catch (e) {
          // Fallback if detail endpoint doesn't exist yet
          setCollection({ id: params.id, name: 'Collection ' + params.id.substring(0, 4) });
        }
      } catch (err) {
        console.error('Failed to load collection fabrics', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 pb-2 flex items-center border-b border-slate-100">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold tracking-tight truncate">
            {collection?.name || 'Loading...'}
          </h2>
          <p className="text-xs text-slate-500">Select a fabric</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-4">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>
        ) : fabrics.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No fabrics found in this collection.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {fabrics.map((fabric) => (
              <Card key={fabric.id} className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => router.push(`/fabrics/${fabric.id}`)}>
                <div className="aspect-square bg-slate-100 relative">
                  {fabric.swatch_url ? (
                    <img src={fabric.swatch_url} alt={fabric.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No Image</div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm truncate">{fabric.name}</h3>
                  <p className="text-xs text-slate-500 truncate">{fabric.code}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
