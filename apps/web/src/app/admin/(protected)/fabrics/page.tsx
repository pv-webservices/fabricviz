'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function FabricsPage() {
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi<{ items: any[] }>('/api/fabrics?limit=50', { requireAuth: true });
        setFabrics(data.items);
      } catch (err) {
        console.error('Failed to load fabrics', err);
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
          <h1 className="text-3xl font-bold tracking-tight">Fabrics</h1>
          <p className="text-muted-foreground">Manage individual fabric SKUs.</p>
        </div>
        <Button>
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
              <TableRow><TableCell colSpan={5} className="text-center">No fabrics found.</TableCell></TableRow>
            ) : (
              fabrics.map((fab) => (
                <TableRow key={fab.id}>
                  <TableCell className="font-medium">{fab.code}</TableCell>
                  <TableCell>{fab.name}</TableCell>
                  <TableCell>{fab.quality}</TableCell>
                  <TableCell>{fab.color_family}</TableCell>
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
