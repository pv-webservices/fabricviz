import React, { useEffect, useState, useRef } from 'react';
import { fetchApi, fetchApiMultipart } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Loader2, Upload } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    end_use: 'both', 
    display_order: 0,
    image_url: '',
    active: true 
  });
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${url}`;
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<{ items: any[] }>('/api/rooms?limit=100', { requireAuth: true });
      // Sort by display_order
      setRooms(data.items.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
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
      setFormData({ 
        name: room.name || '', 
        description: room.description || '',
        end_use: room.end_use || room.endUse || 'both', 
        display_order: room.display_order || room.displayOrder || 0,
        image_url: room.image_url || room.imageUrl || '',
        active: room.active !== false 
      });
    } else {
      setEditingId(null);
      setFormData({ 
        name: '', 
        description: '',
        end_use: 'both', 
        display_order: rooms.length,
        image_url: '',
        active: true 
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', e.target.files[0]);
      const res = await fetchApiMultipart<any>('/api/uploads', {
        method: 'POST', requireAuth: true, body: fd
      });
      setFormData({ ...formData, image_url: res.url });
    } catch (err) {
      toast({ title: 'Upload Error', description: 'Failed to upload image.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleActive = async (room: any) => {
    try {
      await fetchApi(`/api/rooms/${room.id}`, {
        method: 'PUT',
        requireAuth: true,
        body: JSON.stringify({ active: !room.active }),
      });
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update status', variant: 'destructive' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.image_url) {
      toast({ title: 'Validation Error', description: 'Name and Image are required.', variant: 'destructive' });
      return;
    }
    try {
      const payload = {
        name: formData.name,
        endUse: formData.end_use,
        displayOrder: Number(formData.display_order),
        imageUrl: formData.image_url,
        active: formData.active
      };

      if (editingId) {
        await fetchApi(`/api/rooms/${editingId}`, {
          method: 'PUT', requireAuth: true, body: JSON.stringify(payload),
        });
        toast({ title: 'Success', description: 'Room updated' });
      } else {
        await fetchApi('/api/rooms', {
          method: 'POST', requireAuth: true, body: JSON.stringify(payload),
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Predefined Rooms</h1>
          <p className="text-slate-400">Manage sample rooms that users can select from</p>
        </div>
        <Button onClick={() => openModal()} className="bg-red-600 hover:bg-red-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Room
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-500" /></div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 text-slate-500 border border-slate-800 rounded-lg">No rooms found. Click Add Room to create one.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-[#1e1e1e] border border-slate-800 rounded-xl overflow-hidden flex flex-col group transition-all hover:border-slate-700">
              <div className="relative h-48 w-full bg-slate-900">
                {room.image_url || room.imageUrl ? (
                  <img src={getImageUrl(room.image_url || room.imageUrl)} alt={room.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center mb-1">
                  <h3 className="font-bold text-white text-lg mr-2">{room.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 border border-blue-800">
                    {room.end_use || room.endUse}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4 flex-1">Order: {room.display_order || room.displayOrder || 0}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleToggleActive(room)}>
                    <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${room.active ? 'bg-red-600' : 'bg-slate-700'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${room.active ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm text-slate-300">Active</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700" onClick={() => openModal(room)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-slate-800 border border-slate-700" onClick={() => handleDelete(room.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Room' : 'Add New Room'} className="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <p className="text-sm text-slate-400 mb-4">Create a new predefined room for users to select</p>
          
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">Room Name *</Label>
            <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Modern Living Room" className="bg-[#1e1e1e] border-slate-700 text-white focus-visible:ring-red-600" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-300">Description</Label>
            <textarea 
              id="description" 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Optional description of the room" 
              className="flex min-h-[80px] w-full rounded-md border border-slate-700 bg-[#1e1e1e] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayOrder" className="text-slate-300">Display Order</Label>
            <Input id="displayOrder" type="number" value={formData.display_order} onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} className="bg-[#1e1e1e] border-slate-700 text-white focus-visible:ring-red-600" />
            <p className="text-xs text-slate-500">Lower numbers appear first</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endUse" className="text-slate-300">End Use *</Label>
            <select
              id="endUse"
              className="flex h-10 w-full rounded-md border border-slate-700 bg-[#1e1e1e] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              value={formData.end_use}
              onChange={e => setFormData({ ...formData, end_use: e.target.value })}
            >
              <option value="both">Both (Sofa & Curtain)</option>
              <option value="sofa">Sofa</option>
              <option value="curtain">Curtain</option>
              <option value="rug">Rug</option>
              <option value="wallpaper">Wallpaper</option>
            </select>
            <p className="text-xs text-slate-500">Rooms will be shown only for fabrics matching this end use</p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Room Image *</Label>
            {formData.image_url ? (
              <div className="relative h-40 w-full rounded-md overflow-hidden border border-slate-700 group">
                <img src={getImageUrl(formData.image_url)} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                   <Button type="button" variant="outline" className="text-white border-white bg-transparent hover:bg-white/20" onClick={() => fileInputRef.current?.click()}>
                     <Upload className="mr-2 h-4 w-4" /> Change Image
                   </Button>
                </div>
              </div>
            ) : (
              <div 
                className="border border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-slate-500 mb-2" />
                    <span className="text-sm text-slate-300">Upload Image</span>
                  </>
                )}
              </div>
            )}
            <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <div className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${formData.active ? 'bg-red-600 border-red-600' : 'bg-transparent border-slate-600'}`} onClick={() => setFormData({ ...formData, active: !formData.active })}>
               {formData.active && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <Label className="text-slate-300 cursor-pointer" onClick={() => setFormData({ ...formData, active: !formData.active })}>Active (visible to users)</Label>
          </div>
          
          <div className="pt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</Button>
            <Button type="submit" disabled={isUploading} className="bg-red-600 hover:bg-red-700 text-white border-0">
               {editingId ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
