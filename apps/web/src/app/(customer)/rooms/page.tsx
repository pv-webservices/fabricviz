'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Camera, Target, ChevronLeft } from 'lucide-react';

function RoomsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fabricId = searchParams.get('fabricId');
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Area Selection State
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

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

  const handleSelectRoom = (room: any) => {
    if (!fabricId) {
      alert('Please select a fabric first.');
      router.push('/');
      return;
    }
    // Check if room has multiple zones (mock logic: if it's a specific type, or just randomly simulate)
    // Here we'll just simulate that all rooms have zones to demonstrate the flow
    setSelectedRoom(room);
  };

  const confirmRender = (zone?: string) => {
    router.push(`/render?fabricId=${fabricId}&roomId=${selectedRoom.id}&objectType=sofa&sourceType=predefined_room${zone ? `&zone=${zone}` : ''}`);
  };

  const handleUpload = () => {
    if (!fabricId) {
      alert('Please select a fabric first.');
      router.push('/');
      return;
    }
    const fakeUploadedUrl = 'https://example.com/uploaded-room.jpg';
    router.push(`/render?fabricId=${fabricId}&uploadUrl=${encodeURIComponent(fakeUploadedUrl)}&objectType=sofa&sourceType=upload`);
  };

  if (selectedRoom) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="p-4 pb-2 flex items-center border-b border-slate-100">
          <Button variant="ghost" size="icon" onClick={() => setSelectedRoom(null)} className="mr-2">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Select Area</h2>
            <p className="text-xs text-slate-500 mt-0.5">Which part to upholster?</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          <div className="relative w-full aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden shadow-inner mb-6">
            {selectedRoom.image_url ? (
              <img src={selectedRoom.image_url} alt={selectedRoom.name} className="w-full h-full object-cover opacity-80" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">No Image</div>
            )}
            
            {/* Mock interactive zones over the image */}
            <div 
              className="absolute top-[30%] left-[20%] w-[60%] h-[40%] border-2 border-blue-500 bg-blue-500/20 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-500/40 transition-colors"
              onClick={() => confirmRender('primary_sofa')}
            >
              <div className="bg-white/90 px-3 py-1.5 rounded-full text-xs font-bold text-blue-700 flex items-center shadow-sm">
                <Target className="w-3 h-3 mr-1" /> Sofa
              </div>
            </div>
            
            <div 
              className="absolute top-[20%] left-[5%] w-[20%] h-[60%] border-2 border-emerald-500 bg-emerald-500/20 rounded-lg flex items-center justify-center cursor-pointer hover:bg-emerald-500/40 transition-colors"
              onClick={() => confirmRender('curtains')}
            >
              <div className="bg-white/90 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-700 flex items-center shadow-sm">
                <Target className="w-3 h-3 mr-1" /> Curtains
              </div>
            </div>
          </div>
          
          <div className="mt-auto space-y-3 pb-6">
            <Button className="w-full h-12 text-base font-semibold" onClick={() => confirmRender()}>
              Apply to Whole Room
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
              <Card key={room.id} className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => handleSelectRoom(room)}>
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
    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      <RoomsContent />
    </Suspense>
  );
}
