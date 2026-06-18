'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';

function CollectionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const endUse = searchParams.get('end_use');
  
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const query = endUse ? `?limit=50&end_use=${endUse}` : '?limit=50';
        const data = await fetchApi<{ items: any[] }>(`/api/collections${query}`, { requireAuth: true });
        
        // If the API doesn't support server-side filtering, filter client-side as fallback
        const filtered = endUse 
          ? data.items.filter(c => c.end_use?.toLowerCase() === endUse.toLowerCase())
          : data.items;
          
        setCollections(filtered);
      } catch (err) {
        console.error('Failed to load collections', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [endUse]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 pb-2 flex items-center border-b border-slate-100">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="mr-2">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold tracking-tight capitalize">
          {endUse ? `${endUse} Collections` : 'All Collections'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-4">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No collections found.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {collections.map((col) => (
              <Card key={col.id} className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => router.push(`/collections/${col.id}`)}>
                <div className="aspect-square bg-slate-100 relative flex items-center justify-center">
                  <Folder className="w-12 h-12 text-slate-300" />
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm truncate">{col.name}</h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5 capitalize">{col.end_use}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      <CollectionsContent />
    </Suspense>
  );
}
