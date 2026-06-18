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

export default function FabricsPage() {
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', quality: '', color_family: '', collection_id: '' });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [fabData, colData] = await Promise.all([
        fetchApi<{ items: any[] }>('/api/fabrics?limit=100', { requireAuth: true }),
        fetchApi<{ items: any[] }>('/api/collections?limit=50', { requireAuth: true })
      ]);
      setFabrics(fabData.items);
      setCollections(colData.items);
    } catch (err) {
      console.error('Failed to load data', err);
      toast({ title: 'Error', description: 'Failed to load fabrics', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (fabric?: any) => {
    if (fabric) {
      setEditingId(fabric.id);
      setFormData({ 
        name: fabric.name || '', 
        code: fabric.code || '', 
        quality: fabric.quality || '', 
        color_family: fabric.color_family || '',
        collection_id: fabric.collection_id || (collections[0]?.id || '')
      });
    } else {
      setEditingId(null);
      setFormData({ 
        name: '', code: '', quality: '', color_family: '', 
        collection_id: collections[0]?.id || '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetchApi(`/api/fabrics/${editingId}`, {
          method: 'PATCH',
          requireAuth: true,
          body: JSON.stringify(formData),
        });
        toast({ title: 'Success', description: 'Fabric updated' });
      } else {
        await fetchApi('/api/fabrics', {
          method: 'POST',
          requireAuth: true,
          body: JSON.stringify(formData),
        });
        toast({ title: 'Success', description: 'Fabric created' });
      }
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fabric?')) return;
    try {
      await fetchApi(`/api/fabrics/${id}`, { method: 'DELETE', requireAuth: true });
      toast({ title: 'Success', description: 'Fabric deleted' });
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fabrics</h1>
          <p className="text-muted-foreground">Manage individual fabric SKUs.</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="mr-2 h-4 w-4" /> Add Fabric
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Quality</TableHead>
              <TableHead>Color</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
            ) : fabrics.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-slate-500">No fabrics found.</TableCell></TableRow>
            ) : (
              fabrics.map((fab) => (
                <TableRow key={fab.id}>
                  <TableCell className="font-medium">{fab.code}</TableCell>
                  <TableCell>{fab.name}</TableCell>
                  <TableCell>{fab.quality}</TableCell>
                  <TableCell className="capitalize">{fab.color_family}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openModal(fab)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(fab.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Fabric' : 'New Fabric'}>
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="code">SKU Code</Label>
            <Input id="code" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. SL-202" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Fabric Name</Label>
            <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Summer Linen" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quality">Quality</Label>
            <Input id="quality" value={formData.quality} onChange={e => setFormData({ ...formData, quality: e.target.value })} placeholder="e.g. Premium" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color_family">Color Family</Label>
            <Input id="color_family" value={formData.color_family} onChange={e => setFormData({ ...formData, color_family: e.target.value })} placeholder="e.g. blue" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection_id">Collection</Label>
            <select
              id="collection_id"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.collection_id}
              onChange={e => setFormData({ ...formData, collection_id: e.target.value })}
            >
              {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Fabric</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
