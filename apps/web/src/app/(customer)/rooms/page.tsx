'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Camera } from 'lucide-react';

function RoomsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fabricId = searchParams.get('fabricId');
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<{ items: any[] }>('/api/rooms?limit=50', { requireAuth: true });
        setRooms(data.items);
      } catch (err) {
        console.error('Failed to load rooms', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSelect = (roomId: string) => {
    if (!fabricId) {
      alert('Please select a fabric first.');
      router.push('/fabrics');
      return;
    }
    router.push(`/render?fabricId=${fabricId}&roomId=${roomId}`);
  };

  const handleUpload = () => {
    // Basic mock upload for now
    if (!fabricId) {
      alert('Please select a fabric first.');
      router.push('/fabrics');
      return;
    }
    const fakeUploadedUrl = 'https://example.com/uploaded-room.jpg';
    router.push(`/render?fabricId=${fabricId}&uploadUrl=${encodeURIComponent(fakeUploadedUrl)}`);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 pb-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Select a Room</h2>
        <p className="text-sm text-slate-500 mt-1">Choose a sample room or upload your own.</p>
      </div>

      <div className="px-4 py-2 flex gap-3">
        <Button variant="outline" className="flex-1 h-12" onClick={handleUpload}>
          <Camera className="w-4 h-4 mr-2 text-slate-500" />
          Camera
        </Button>
        <Button variant="outline" className="flex-1 h-12" onClick={handleUpload}>
          <Upload className="w-4 h-4 mr-2 text-slate-500" />
          Gallery
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-2">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No rooms available.</div>
        ) : (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <Card key={room.id} className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => handleSelect(room.id)}>
                <div className="aspect-[4/3] bg-slate-100 relative">
                  {room.image_url ? (
                    <img src={room.image_url} alt={room.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">No Image</div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-base">{room.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <RoomsContent />
    </Suspense>
  );
}
