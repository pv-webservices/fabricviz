'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function RoomsPage() {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predefined Rooms</h1>
          <p className="text-muted-foreground">Manage sample room templates.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Room
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>End Use</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
            ) : rooms.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center">No rooms found.</TableCell></TableRow>
            ) : (
              rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>
                    {room.thumbnail_url ? (
                      <img src={room.thumbnail_url} alt={room.name} className="h-10 w-16 object-cover rounded" />
                    ) : (
                      <div className="h-10 w-16 bg-slate-100 rounded" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell className="capitalize">{room.end_use}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${room.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                      {room.active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
