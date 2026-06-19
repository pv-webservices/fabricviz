'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<{ items: any[] }>('/api/history?limit=30', { requireAuth: true });
        setHistory(data.items);
      } catch (err) {
        console.error('Failed to load history', err);
        // Fallback demo data
        setHistory([
          { id: 'vis_1', created_at: new Date().toISOString(), thumbnail_url: 'https://placehold.co/100x100/3b82f6/ffffff', fabric: { name: 'Velvet Royal', code: 'VR-001' } },
          { id: 'vis_2', created_at: new Date(Date.now() - 86400000).toISOString(), thumbnail_url: 'https://placehold.co/100x100/10b981/ffffff', fabric: { name: 'Summer Linen', code: 'SL-202' } },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 pb-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your History</h2>
        <p className="text-sm text-slate-500 mt-1">Recently rendered visualizations.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-2">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No history found.</div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <Card key={item.id} className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => router.push(`/render/${item.id}`)}>
                <CardContent className="p-3 flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded overflow-hidden shrink-0">
                    <img src={item.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{item.fabric?.name || 'Fabric'}</h3>
                    <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
