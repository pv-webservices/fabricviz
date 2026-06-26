import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ code: '', customer_name: '', company_name: '', active: true });
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<{ items: any[] }>('/api/access-codes?limit=50', { requireAuth: true });
      setCustomers(data.items);
    } catch (err) {
      console.error('Failed to load customers', err);
      toast({ title: 'Error', description: 'Failed to load access codes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (customer?: any) => {
    if (customer) {
      setEditingId(customer.id);
      setFormData({ 
        code: customer.code || '', 
        customer_name: customer.customer_name || '', 
        company_name: customer.company_name || '', 
        active: customer.active !== false 
      });
    } else {
      setEditingId(null);
      // Generate a random 5 char code
      const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
      setFormData({ code: randomCode, customer_name: '', company_name: '', active: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetchApi(`/api/access-codes/${editingId}`, {
          method: 'PATCH',
          requireAuth: true,
          body: JSON.stringify(formData),
        });
        toast({ title: 'Success', description: 'Access code updated' });
      } else {
        await fetchApi('/api/access-codes', {
          method: 'POST',
          requireAuth: true,
          body: JSON.stringify(formData),
        });
        toast({ title: 'Success', description: 'Access code created' });
      }
      setIsModalOpen(false);
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this access code?')) return;
    try {
      await fetchApi(`/api/access-codes/${id}`, { method: 'DELETE', requireAuth: true });
      toast({ title: 'Success', description: 'Access code deleted' });
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Access Codes</h1>
          <p className="text-muted-foreground">Manage customer access codes.</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="mr-2 h-4 w-4" /> Generate Code
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
            ) : customers.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-slate-500">No access codes found.</TableCell></TableRow>
            ) : (
              customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium tracking-wider">{c.code}</TableCell>
                  <TableCell>{c.customer_name}</TableCell>
                  <TableCell>{c.company_name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openModal(c)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Access Code' : 'New Access Code'}>
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="code">Access Code</Label>
            <Input id="code" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. AB123" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer_name">Customer Name</Label>
            <Input id="customer_name" required value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} placeholder="e.g. John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input id="company_name" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} placeholder="e.g. ACME Corp" />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <input 
              type="checkbox" 
              id="active" 
              checked={formData.active} 
              onChange={e => setFormData({ ...formData, active: e.target.checked })} 
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="active">Active (Can be used to log in)</Label>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Code</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
