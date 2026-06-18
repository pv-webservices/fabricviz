'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', end_use: 'sofa', active: true });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<{ items: any[] }>('/api/rooms?limit=50', { requireAuth: true });
      setRooms(data.items);
    } catch (err) {
      console.error('Failed to load rooms', err);
      toast({ title: 'Error', description: 'Failed to load rooms', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (room?: any) => {
    if (room) {
      setEditingId(room.id);
      setFormData({ name: room.name || '', end_use: room.end_use || 'sofa', active: room.active !== false });
    } else {
      setEditingId(null);
      setFormData({ name: '', end_use: 'sofa', active: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetchApi(`/api/rooms/${editingId}`, {
          method: 'PATCH',
          requireAuth: true,
          body: JSON.stringify(formData),
        });
        toast({ title: 'Success', description: 'Room updated' });
      } else {
        await fetchApi('/api/rooms', {
          method: 'POST',
          requireAuth: true,
          body: JSON.stringify(formData),
        });
        toast({ title: 'Success', description: 'Room created' });
      }
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      await fetchApi(`/api/rooms/${id}`, { method: 'DELETE', requireAuth: true });
      toast({ title: 'Success', description: 'Room deleted' });
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predefined Rooms</h1>
          <p className="text-muted-foreground">Manage sample room templates.</p>
        </div>
        <Button onClick={() => openModal()}>
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
              <TableRow><TableCell colSpan={5} className="text-center text-slate-500">No rooms found.</TableCell></TableRow>
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
                    <Button variant="ghost" size="icon" onClick={() => openModal(room)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(room.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Room' : 'New Room'}>
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Room Name</Label>
            <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Modern Living Room" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endUse">End Use</Label>
            <select
              id="endUse"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.end_use}
              onChange={e => setFormData({ ...formData, end_use: e.target.value })}
            >
              <option value="sofa">Sofa</option>
              <option value="curtain">Curtain</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox" 
              id="active" 
              checked={formData.active} 
              onChange={e => setFormData({ ...formData, active: e.target.checked })} 
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="active">Active (Visible to customers)</Label>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Room</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
