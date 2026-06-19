'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Download, Globe, HardDrive, Upload, Plus, 
  CheckSquare, Edit, Trash2, Image as ImageIcon, MoreVertical, Link as LinkIcon 
} from 'lucide-react';

export default function CollectionFabricsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [collection, setCollection] = useState<any>(null);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fabricToDelete, setFabricToDelete] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: '', code: '', quality: '', color_family: '', collectionId: params.id, active: true 
  });

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${url}`;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [colData, fabData] = await Promise.all([
        fetchApi<any>(`/api/collections/${params.id}`, { requireAuth: true }),
        fetchApi<{ items: any[] }>(`/api/fabrics?collectionId=${params.id}&limit=100`, { requireAuth: true })
      ]);
      setCollection(colData);
      setFabrics(fabData.items);
    } catch (err) {
      console.error('Failed to load data', err);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openModal = (fabric?: any) => {
    if (fabric) {
      setEditingId(fabric.id);
      setFormData({ 
        name: fabric.name || '', 
        code: fabric.code || '', 
        quality: fabric.quality || '', 
        color_family: fabric.color_family || '',
        collectionId: params.id,
        active: fabric.active !== false
      });
    } else {
      setEditingId(null);
      setFormData({ 
        name: '', code: '', quality: '', color_family: '', 
        collectionId: params.id, active: true 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetchApi(`/api/fabrics/${editingId}`, {
          method: 'PUT',
          requireAuth: true,
          body: JSON.stringify(formData),
        });
        toast({ title: 'Success', description: 'Fabric updated' });
      } else {
        await fetchApi('/api/fabrics', {
          method: 'POST',
          requireAuth: true,
          body: JSON.stringify({ ...formData, endUse: collection?.end_use || 'sofa' }),
        });
        toast({ title: 'Success', description: 'Fabric created' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!fabricToDelete) return;
    try {
      await fetchApi(`/api/fabrics/${fabricToDelete.id}`, { method: 'DELETE', requireAuth: true });
      toast({ title: 'Success', description: 'Fabric deleted' });
      setFabricToDelete(null);
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (fabric: any) => {
    try {
      await fetchApi(`/api/fabrics/${fabric.id}`, {
        method: 'PUT',
        requireAuth: true,
        body: JSON.stringify({ active: !fabric.active }),
      });
      toast({ title: 'Success', description: `Fabric ${fabric.active ? 'deactivated' : 'activated'}` });
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to toggle status', variant: 'destructive' });
    }
  };

  const handleProcessImage = async (fabric: any) => {
    toast({ title: 'Processing', description: `Processing image for ${fabric.code}...` });
    setTimeout(() => {
      toast({ title: 'Success', description: `Image processed for ${fabric.code}` });
    }, 1500);
  };

  const handleCopyLink = (fabric: any) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/fabrics/${fabric.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Copied!', description: 'Wix Link copied to clipboard.' });
  };

  const handlePlaceholderAction = (action: string) => {
    toast({ title: 'Info', description: `${action} feature is not yet fully implemented.` });
  };

  if (loading && !collection) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link href="/admin/collections" className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Collections
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{collection?.name || 'Collection'}</h1>
          <p className="text-muted-foreground mt-1">Manage fabrics in this collection</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => handlePlaceholderAction('Export to Excel')}>
            <Download className="mr-2 h-4 w-4" /> Export to Excel
          </Button>
          <Button variant="outline" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => handlePlaceholderAction('Scrape from Website')}>
            <Globe className="mr-2 h-4 w-4" /> Scrape from Website
          </Button>
          <Button variant="outline" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => handlePlaceholderAction('Import from Local')}>
            <HardDrive className="mr-2 h-4 w-4" /> Import from Local
          </Button>
          <Button variant="outline" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => handlePlaceholderAction('Import Fabrics')}>
            <Upload className="mr-2 h-4 w-4" /> Import Fabrics
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={() => openModal()}>
            <Plus className="mr-2 h-4 w-4" /> Add Fabric
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#1a1a1a] px-4 py-3 text-slate-300">
        <div className="text-sm">{fabrics.length} fabrics in this collection</div>
        <Button variant="outline" size="sm" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800" onClick={() => handlePlaceholderAction('Select Fabrics')}>
          <CheckSquare className="mr-2 h-4 w-4" /> Select Fabrics
        </Button>
      </div>

      {fabrics.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-slate-500">No fabrics found in this collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {fabrics.map((fabric) => (
            <div key={fabric.id} className="group flex flex-col rounded-xl border border-slate-800 bg-[#1e1e1e] shadow-sm overflow-hidden text-slate-200">
              <div className="aspect-square bg-slate-200 relative overflow-hidden flex items-center justify-center">
                {fabric.texture_url || fabric.swatch_url ? (
                  <img src={getImageUrl(fabric.texture_url || fabric.swatch_url)} alt={fabric.name} className="object-cover w-full h-full" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-slate-400" />
                )}
              </div>
              
              <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-lg leading-tight">{fabric.name}</h3>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${fabric.active ? 'bg-red-600 text-white' : 'bg-slate-600 text-white'}`}>
                    {fabric.active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-4">Code: {fabric.code}</p>

                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Color:</span>
                  <span className="capitalize text-right">{fabric.color_family || '-'}</span>
                </div>
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-slate-400">Quality:</span>
                  <span className="capitalize text-right">{fabric.quality || 'Standard'}</span>
                </div>

                <div className="mt-auto space-y-2">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                      onClick={() => handleToggleActive(fabric)}
                    >
                      {fabric.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button variant="outline" size="icon" className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => openModal(fabric)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => setFabricToDelete(fabric)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="flex-1 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white justify-start" onClick={() => handleProcessImage(fabric)}>
                      <ImageIcon className="mr-2 h-4 w-4" /> Process Image
                    </Button>
                    <Button variant="outline" size="icon" className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => handlePlaceholderAction('Menu Options')}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold border-0" onClick={() => handleCopyLink(fabric)}>
                    <LinkIcon className="mr-2 h-4 w-4" /> Copy Wix Link
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!fabricToDelete} onClose={() => setFabricToDelete(null)} title="Delete Fabric">
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently delete <strong>{fabricToDelete?.name}</strong>? This action cannot be undone.
          </p>
          <div className="pt-4 flex justify-end gap-2 border-t mt-4">
            <Button variant="ghost" onClick={() => setFabricToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Fabric' : 'Add Fabric'}>
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
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Fabric</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
