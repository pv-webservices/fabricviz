'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Search, Download, Package, Image as ImageIcon } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    thumbnailUrl: '', 
    groupId: '', 
    endUse: 'sofa', 
    qrCode: '', 
    active: true 
  });
  const { toast } = useToast();

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${url}`;
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ limit: '50', sortBy, sortOrder });
      if (searchTerm) query.append('search', searchTerm);
      
      const data = await fetchApi<{ items: any[] }>(`/api/collections?${query.toString()}`, { requireAuth: true });
      setCollections(data.items);
    } catch (err) {
      console.error('Failed to load collections', err);
      toast({ title: 'Error', description: 'Failed to load collections', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy, sortOrder, toast]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [load]);

  const openModal = (collection?: any) => {
    if (collection) {
      setEditingId(collection.id);
      setFormData({ 
        name: collection.name || '', 
        description: collection.description || '', 
        thumbnailUrl: collection.thumbnail_url || '', 
        groupId: collection.group_id || '', 
        endUse: collection.end_use || 'sofa', 
        qrCode: collection.qr_code || '', 
        active: collection.active !== false 
      });
    } else {
      setEditingId(null);
      setFormData({ 
        name: '', 
        description: '', 
        thumbnailUrl: '', 
        groupId: '', 
        endUse: 'sofa', 
        qrCode: '', 
        active: true 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Clean up empty strings so Zod url/uuid validators don't fail
      const payload: any = { ...formData };
      if (!payload.description) delete payload.description;
      if (!payload.thumbnailUrl) delete payload.thumbnailUrl;
      if (!payload.groupId) delete payload.groupId;
      if (!payload.qrCode) delete payload.qrCode;

      if (editingId) {
        await fetchApi(`/api/collections/${editingId}`, {
          method: 'PUT',
          requireAuth: true,
          body: JSON.stringify(payload),
        });
        toast({ title: 'Success', description: 'Collection updated' });
      } else {
        await fetchApi('/api/collections', {
          method: 'POST',
          requireAuth: true,
          body: JSON.stringify(payload),
        });
        toast({ title: 'Success', description: 'Collection created' });
      }
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;
    try {
      await fetchApi(`/api/collections/${id}`, { method: 'DELETE', requireAuth: true });
      toast({ title: 'Success', description: 'Collection deleted' });
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const form = new FormData();
      form.append('file', file);
      
      const token = getAuthToken();
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/uploads', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: form
        });
        const json = await res.json();
        if (json.success) {
          setFormData(prev => ({ ...prev, thumbnailUrl: json.data.url }));
          toast({ title: 'Success', description: 'Image uploaded successfully' });
        } else {
          toast({ title: 'Error', description: json.error?.message || 'Upload failed', variant: 'destructive' });
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fabric Collections</h1>
          <p className="text-muted-foreground mt-1">Manage your fabric collections and swatches.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => alert('Export not implemented yet')}>
            <Download className="mr-2 h-4 w-4" /> Export to Excel
          </Button>
          <Button onClick={() => openModal()}>
            <Plus className="mr-2 h-4 w-4" /> Add Collection
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search collections by name (e.g., Sofa, Curtain)..." 
            className="pl-10 w-full bg-white"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="created_at">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="display_order">Sort by Order</option>
          </select>
          <select 
            className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
        </div>
      ) : collections.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-slate-500">No collections found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collections.map((col) => (
            <div key={col.id} className="group flex flex-col rounded-xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden flex items-center justify-center">
                {col.thumbnail_url ? (
                  <img src={getImageUrl(col.thumbnail_url)} alt={col.name} className="object-cover w-full h-full" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-slate-300" />
                )}
                {!col.active && (
                  <div className="absolute top-3 right-3 bg-slate-900/70 text-white text-xs font-semibold px-2 py-1 rounded-md backdrop-blur-sm">
                    Inactive
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-semibold text-lg line-clamp-1">{col.name}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2 min-h-[40px]">
                  {col.description || 'No description'}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-4 mb-4">
                  {col.fabricCount || 0} fabrics
                </p>
                
                <div className="mt-auto flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Button 
                    variant="secondary" 
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900" 
                    onClick={() => router.push(`/admin/fabrics?collection_id=${col.id}`)}
                  >
                    <Package className="mr-2 h-4 w-4" /> Fabrics
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => openModal(col)} title="Edit">
                    <Edit className="h-4 w-4 text-slate-600" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDelete(col.id)} title="Delete">
                    <Trash2 className="h-4 w-4 text-slate-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Collection' : 'Add Collection'}>
        <form onSubmit={handleSave} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. ALFY" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea 
              id="description" 
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail Image</Label>
            <div className="flex items-center gap-4">
              <Input 
                id="thumbnail" 
                type="file" 
                accept="image/jpeg, image/png"
                onChange={handleFileChange} 
                className="cursor-pointer file:cursor-pointer"
              />
              {formData.thumbnailUrl && (
                <img src={getImageUrl(formData.thumbnailUrl)} alt="Preview" className="h-10 w-10 rounded-md object-cover border" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="groupId">Group</Label>
              <select
                id="groupId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.groupId}
                onChange={e => setFormData({ ...formData, groupId: e.target.value })}
              >
                <option value="">None</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endUse">End Use</Label>
              <select
                id="endUse"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.endUse}
                onChange={e => setFormData({ ...formData, endUse: e.target.value })}
              >
                <option value="sofa">Sofa</option>
                <option value="curtain">Curtain</option>
                <option value="rug">Rug</option>
                <option value="wallpaper">Wallpaper</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qrCode">QR Code Content (Optional)</Label>
            <Input 
              id="qrCode" 
              value={formData.qrCode} 
              onChange={e => setFormData({ ...formData, qrCode: e.target.value })} 
              placeholder="https://yoursite.com/collection-url" 
            />
            <p className="text-xs text-muted-foreground">Enter the URL or text that your printed QR code decodes to.</p>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox" 
              id="active" 
              checked={formData.active} 
              onChange={e => setFormData({ ...formData, active: e.target.checked })} 
              className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
            />
            <Label htmlFor="active">Active (Visible to customers)</Label>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Collection</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
