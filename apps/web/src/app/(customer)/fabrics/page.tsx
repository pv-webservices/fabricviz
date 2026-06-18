'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FabricsPage() {
  const router = useRouter();
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<{ items: any[] }>('/api/fabrics?limit=50', { requireAuth: true });
        setFabrics(data.items);
      } catch (err) {
        console.error('Failed to load fabrics', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSelect = (id: string) => {
    router.push(`/rooms?fabricId=${id}`);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 pb-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Choose Your Fabric</h2>
        <p className="text-sm text-slate-500 mt-1">Select a fabric to visualize in a room.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-2">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>
        ) : fabrics.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No fabrics available.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {fabrics.map((fabric) => (
              <Card key={fabric.id} className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => handleSelect(fabric.id)}>
                <div className="aspect-square bg-slate-100 relative">
                  {fabric.swatch_url ? (
                    <img src={fabric.swatch_url} alt={fabric.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">No Image</div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm truncate">{fabric.name}</h3>
                  <p className="text-xs text-slate-500 truncate">{fabric.code}</p>
                  <Button size="sm" className="w-full mt-3 h-8 text-xs font-medium">Select</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
