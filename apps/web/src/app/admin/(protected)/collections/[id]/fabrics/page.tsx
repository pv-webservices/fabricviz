'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { fetchApi, fetchApiMultipart } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { 
  ArrowLeft, Download, Globe, HardDrive, Upload, Plus, 
  CheckSquare, Edit, Trash2, Image as ImageIcon, MoreVertical, Link as LinkIcon, Loader2
} from 'lucide-react';

export default function CollectionFabricsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();

  const [collection, setCollection] = useState<any>(null);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Add/Edit Fabric State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fabricToDelete, setFabricToDelete] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const defaultFormData = { 
    name: '', code: '', quality: 'Standard', colorFamily: '', endUse: 'sofa',
    tags: '', repeatWidthMm: '', repeatHeightMm: '', fabricWidthCm: '', priceInr: '',
    swatchUrl: '', textureUrl: '',
    active: true,
    featureFlags: {
      highMartindale: false, waterRepellent: false, antimicrobial: false,
      fadeResistant: false, stainRepellent: false, premiumQuality: false
    }
  };
  const [formData, setFormData] = useState(defaultFormData);

  // --- Scrape State ---
  const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<any[]>([]);

  // --- Import Fabrics (Excel) State ---
  const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // --- Import Local (Images) State ---
  const [isImportLocalModalOpen, setIsImportLocalModalOpen] = useState(false);
  const [localData, setLocalData] = useState<any[]>([]);
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);
  const [isAnalyzingLocal, setIsAnalyzingLocal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => { loadData(); }, [loadData]);

  // ==========================================
  // ADD / EDIT FABRIC LOGIC
  // ==========================================
  const openModal = (fabric?: any) => {
    if (fabric) {
      setEditingId(fabric.id);
      setFormData({ 
        name: fabric.name || '', 
        code: fabric.code || '', 
        quality: fabric.quality || '', 
        colorFamily: fabric.color_family || fabric.colorFamily || '',
        endUse: fabric.end_use || fabric.endUse || collection?.end_use || 'sofa',
        tags: (fabric.tags || []).join(', '),
        repeatWidthMm: fabric.repeat_width_mm || fabric.repeatWidthMm || '',
        repeatHeightMm: fabric.repeat_height_mm || fabric.repeatHeightMm || '',
        fabricWidthCm: fabric.fabric_width_cm || fabric.fabricWidthCm || '',
        priceInr: fabric.price_inr || fabric.priceInr || '',
        swatchUrl: fabric.swatch_url || fabric.swatchUrl || '',
        textureUrl: fabric.texture_url || fabric.textureUrl || '',
        active: fabric.active !== false,
        featureFlags: {
          highMartindale: fabric.featureFlags?.highMartindale || false,
          waterRepellent: fabric.featureFlags?.waterRepellent || false,
          antimicrobial: fabric.featureFlags?.antimicrobial || false,
          fadeResistant: fabric.featureFlags?.fadeResistant || false,
          stainRepellent: fabric.featureFlags?.stainRepellent || false,
          premiumQuality: fabric.featureFlags?.premiumQuality || false,
        }
      });
    } else {
      setEditingId(null);
      setFormData({ ...defaultFormData, endUse: collection?.end_use || 'sofa' });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    try {
      const fd = new FormData();
      fd.append('file', e.target.files[0]);
      const res = await fetchApiMultipart<any>('/api/uploads', {
        method: 'POST', requireAuth: true, body: fd
      });
      setFormData({ ...formData, textureUrl: res.url });
      toast({ title: 'Success', description: 'Image uploaded' });
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        code: formData.code,
        quality: formData.quality || undefined,
        colorFamily: formData.colorFamily || undefined,
        endUse: formData.endUse,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        repeatWidthMm: formData.repeatWidthMm ? Number(formData.repeatWidthMm) : undefined,
        repeatHeightMm: formData.repeatHeightMm ? Number(formData.repeatHeightMm) : undefined,
        fabricWidthCm: formData.fabricWidthCm ? Number(formData.fabricWidthCm) : undefined,
        priceInr: formData.priceInr ? Number(formData.priceInr) : undefined,
        active: formData.active,
        featureFlags: formData.featureFlags,
        collectionId: params.id,
      };
      if (formData.textureUrl) payload.textureUrl = formData.textureUrl;
      if (formData.swatchUrl) payload.swatchUrl = formData.swatchUrl;

      if (editingId) {
        await fetchApi(`/api/fabrics/${editingId}`, { method: 'PUT', requireAuth: true, body: JSON.stringify(payload) });
        toast({ title: 'Success', description: 'Fabric updated' });
      } else {
        await fetchApi('/api/fabrics', { method: 'POST', requireAuth: true, body: JSON.stringify(payload) });
        toast({ title: 'Success', description: 'Fabric created' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setIsSaving(false);
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
        method: 'PUT', requireAuth: true, body: JSON.stringify({ active: !fabric.active })
      });
      toast({ title: 'Success', description: `Fabric ${fabric.active ? 'deactivated' : 'activated'}` });
      loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to toggle status', variant: 'destructive' });
    }
  };

  const handleCopyLink = (fabric: any) => {
    const url = `${window.location.origin}/fabrics/${fabric.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Copied!', description: 'Wix Link copied to clipboard.' });
  };

  const handleProcessImage = async (fabric: any) => {
    toast({ title: 'Processing', description: `Processing image for ${fabric.code}...` });
  };

  // ==========================================
  // EXPORT LOGIC
  // ==========================================
  const handleExportExcel = () => {
    if (!fabrics.length) return toast({ title: 'Info', description: 'No fabrics to export' });
    const dataToExport = fabrics.map(f => ({
      name: f.name,
      sku: f.code,
      image_url: getImageUrl(f.texture_url || f.swatch_url),
      google_drive_link: '',
      colour_name: f.color_family || f.colorFamily || '',
      product_feel: f.quality || '',
      tags: (f.tags || []).join(', '),
      use_of_fabric: f.end_use || f.endUse || '',
      width_inches: f.fabric_width_cm ? (f.fabric_width_cm / 2.54).toFixed(2) : '',
      mrp_inr: f.price_inr || f.priceInr || '',
      tax_note: 'Exclusive of all taxes',
      source_url: '',
      is_active: f.active ? 'TRUE' : 'FALSE'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fabrics");
    XLSX.writeFile(wb, `${collection?.name || 'Collection'}_Fabrics.xlsx`);
    toast({ title: 'Success', description: 'Excel generated and downloaded.' });
  };

  // ==========================================
  // SCRAPE LOGIC
  // ==========================================
  const handleScrape = async () => {
    if (!scrapeUrl) return;
    setIsScraping(true);
    try {
      const res = await fetchApi<any>('/api/scraper/scrape', {
        method: 'POST', requireAuth: true, body: JSON.stringify({ url: scrapeUrl })
      });
      setScrapedData(res.fabrics || []);
      toast({ title: 'Success', description: `Found ${res.fabrics?.length || 0} fabrics.` });
    } catch (err: any) {
      toast({ title: 'Scrape Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsScraping(false);
    }
  };

  const handleScrapedRowChange = (index: number, field: string, value: any) => {
    const newData = [...scrapedData];
    newData[index] = { ...newData[index], [field]: value };
    setScrapedData(newData);
  };

  const handleGenerateScrapedExcel = () => {
    const dataToExport = scrapedData.map(f => ({
      name: f.name,
      sku: f.code,
      image_url: f.imageUrl || '',
      google_drive_link: '',
      colour_name: f.colorFamily || '',
      product_feel: f.quality || '',
      tags: (f.tags || []).join(', '),
      use_of_fabric: f.endUse || 'sofa',
      width_inches: f.fabricWidthCm ? (f.fabricWidthCm / 2.54).toFixed(2) : '',
      mrp_inr: f.priceInr || '',
      tax_note: 'Exclusive of all taxes',
      source_url: scrapeUrl,
      is_active: f.active !== false ? 'TRUE' : 'FALSE'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scraped");
    XLSX.writeFile(wb, "Scraped_Fabrics.xlsx");
    toast({ title: 'Success', description: 'Scraped Excel generated.' });
  };

  // ==========================================
  // IMPORT EXCEL LOGIC
  // ==========================================
  const handleImportExcelFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // Map to bulkImportSchema
        const mappedData = data.map((row: any) => ({
          collectionId: params.id,
          name: String(row.name || row.Name || ''),
          code: String(row.sku || row.SKU || row.code || ''),
          textureUrl: row.image_url || row.Image || '',
          colorFamily: row.colour_name || row.Color || '',
          quality: row.product_feel || row.Quality || 'Standard',
          endUse: ['sofa','curtain','both','rug','wallpaper'].includes(row.use_of_fabric?.toLowerCase()) ? row.use_of_fabric.toLowerCase() : 'sofa',
          priceInr: Number(row.mrp_inr || row.Price || 0),
          fabricWidthCm: row.width_inches ? Math.round(Number(row.width_inches) * 2.54) : 140,
          active: String(row.is_active).toUpperCase() === 'TRUE',
          featureFlags: {}
        }));
        setExcelData(mappedData);
      } catch (err: any) {
        toast({ title: 'Parse Error', description: 'Could not read Excel file.', variant: 'destructive' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveImportedExcel = async () => {
    if (!excelData.length) return;
    setIsImporting(true);
    try {
      await fetchApi('/api/fabrics/import', {
        method: 'POST', requireAuth: true, body: JSON.stringify({ fabrics: excelData })
      });
      toast({ title: 'Success', description: `Imported ${excelData.length} fabrics successfully.` });
      setIsImportExcelModalOpen(false);
      setExcelData([]);
      loadData();
    } catch (err: any) {
      toast({ title: 'Import Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  // ==========================================
  // IMPORT LOCAL IMAGES LOGIC
  // ==========================================
  const handleLocalImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploadingLocal(true);
    
    const newItems: any[] = [];
    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetchApiMultipart<any>('/api/uploads', { method: 'POST', requireAuth: true, body: fd });
        
        // Auto-extract name/sku from filename if possible
        const baseName = file.name.split('.')[0];
        const parts = baseName.split('-');
        let name = baseName;
        let code = `SKU-${Math.floor(Math.random()*10000)}`;
        if (parts.length > 1) {
          name = parts[0].trim();
          code = parts.slice(1).join('-').trim();
        }

        newItems.push({
          collectionId: params.id,
          name, code, textureUrl: res.url,
          colorFamily: '', quality: 'Standard', endUse: 'sofa',
          priceInr: 0, active: true, featureFlags: {}
        });
      } catch (err) {
        toast({ title: 'Upload Error', description: `Failed to upload ${file.name}`, variant: 'destructive' });
      }
    }
    
    setLocalData(prev => [...prev, ...newItems]);
    setIsUploadingLocal(false);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
  };

  const handleAnalyzeAll = async () => {
    setIsAnalyzingLocal(true);
    // Mocking an AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLocalData(prev => prev.map(item => ({
      ...item,
      colorFamily: item.colorFamily || 'Neutral',
      quality: item.quality || 'Premium',
      endUse: item.endUse || 'Upholstery',
      tags: ['New Arrival'],
      analyzed: true
    })));
    setIsAnalyzingLocal(false);
    toast({ title: 'Analysis Complete', description: `Successfully analyzed ${localData.length} images.` });
  };

  const handleLocalRowChange = (index: number, field: string, value: any) => {
    const newData = [...localData];
    newData[index] = { ...newData[index], [field]: value };
    setLocalData(newData);
  };

  const handleSaveLocalImports = async () => {
    if (!localData.length) return;
    setIsImporting(true);
    try {
      await fetchApi('/api/fabrics/import', {
        method: 'POST', requireAuth: true, body: JSON.stringify({ fabrics: localData })
      });
      toast({ title: 'Success', description: `Saved ${localData.length} images to collection.` });
      setIsImportLocalModalOpen(false);
      setLocalData([]);
      loadData();
    } catch (err: any) {
      toast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };


  if (loading && !collection) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
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
          <Button variant="outline" className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" /> Export to Excel
          </Button>
          <Button variant="outline" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => { setScrapedData([]); setScrapeUrl(''); setIsScrapeModalOpen(true); }}>
            <Globe className="mr-2 h-4 w-4" /> Scrape from Website
          </Button>
          <Button variant="outline" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => setIsImportLocalModalOpen(true)}>
            <HardDrive className="mr-2 h-4 w-4" /> Import from Local
          </Button>
          <Button variant="outline" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => setIsImportExcelModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Import Fabrics
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={() => openModal()}>
            <Plus className="mr-2 h-4 w-4" /> Add Fabric
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#1a1a1a] px-4 py-3 text-slate-300">
        <div className="text-sm">{fabrics.length} fabrics in this collection</div>
        <Button variant="outline" size="sm" className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800">
          <CheckSquare className="mr-2 h-4 w-4" /> Select Fabrics
        </Button>
      </div>

      {fabrics.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center text-slate-500">No fabrics found in this collection.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {fabrics.map((fabric) => (
            <div key={fabric.id} className="group flex flex-col rounded-xl border border-slate-800 bg-[#1e1e1e] shadow-sm overflow-hidden text-slate-200">
              <div className="aspect-square bg-slate-200 relative overflow-hidden flex items-center justify-center">
                {fabric.texture_url || fabric.swatch_url || fabric.textureUrl ? (
                  <img src={getImageUrl(fabric.texture_url || fabric.swatch_url || fabric.textureUrl)} alt={fabric.name} className="object-cover w-full h-full" />
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
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-400">Color:</span><span className="capitalize text-right">{fabric.color_family || fabric.colorFamily || '-'}</span></div>
                <div className="flex justify-between text-sm mb-4"><span className="text-slate-400">Quality:</span><span className="capitalize text-right">{fabric.quality || 'Standard'}</span></div>

                <div className="mt-auto space-y-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="flex-1 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => handleToggleActive(fabric)}>
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
                    <Button variant="outline" size="icon" className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
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

      {/* Scrape Modal */}
      <Modal isOpen={isScrapeModalOpen} onClose={() => setIsScrapeModalOpen(false)} title="Scrape Fabrics from Website">
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-400">Extract fabrics and their details from a catalog page (e.g. Darpan Live category page).</p>
          
          {scrapedData.length === 0 ? (
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label>Catalog URL</Label>
                <Input value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} placeholder="https://www.darpanlive.com/categories/alfy" />
              </div>
              <Button onClick={handleScrape} disabled={isScraping || !scrapeUrl}>
                {isScraping ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Globe className="mr-2 h-4 w-4" />} Scrape
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">Found {scrapedData.length} fabrics</h4>
                  <p className="text-xs text-slate-400">Click Analyze to fill in missing properties</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" disabled className="bg-slate-900 border-slate-700 text-white">Analyze All</Button>
                  <Button onClick={handleGenerateScrapedExcel} className="bg-white text-black hover:bg-slate-200"><Download className="mr-2 h-4 w-4"/> Generate Excel</Button>
                </div>
              </div>
              
              <div className="overflow-x-auto border border-slate-700 rounded-md max-h-[400px]">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-xs text-slate-400 uppercase bg-[#2a2a2a] sticky top-0">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Image</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Colour</th>
                      <th className="px-4 py-3">Price ₹</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scrapedData.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-800 bg-[#1e1e1e]">
                        <td className="px-4 py-3">{idx + 1}</td>
                        <td className="px-4 py-3">
                          {row.imageUrl ? <img src={row.imageUrl} className="w-10 h-10 object-cover rounded" /> : '-'}
                        </td>
                        <td className="px-4 py-3"><Input value={row.name} onChange={e => handleScrapedRowChange(idx, 'name', e.target.value)} className="h-8 min-w-[120px] bg-transparent border-slate-700" /></td>
                        <td className="px-4 py-3"><Input value={row.code} onChange={e => handleScrapedRowChange(idx, 'code', e.target.value)} className="h-8 min-w-[100px] bg-transparent border-slate-700" /></td>
                        <td className="px-4 py-3"><Input value={row.colorFamily} onChange={e => handleScrapedRowChange(idx, 'colorFamily', e.target.value)} className="h-8 min-w-[80px] bg-transparent border-slate-700" /></td>
                        <td className="px-4 py-3"><Input type="number" value={row.priceInr} onChange={e => handleScrapedRowChange(idx, 'priceInr', Number(e.target.value))} className="h-8 min-w-[80px] bg-transparent border-slate-700" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Import Excel Modal */}
      <Modal isOpen={isImportExcelModalOpen} onClose={() => setIsImportExcelModalOpen(false)} title="Import Fabrics from Excel" className="max-w-4xl">
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-400">Upload an Excel file with fabric details and Google Drive image links</p>
          
          <div className="flex items-center justify-between bg-[#1e1e1e] border border-slate-800 rounded-md p-4">
            <div>
              <h5 className="text-white font-medium">Need a template?</h5>
              <p className="text-sm text-slate-400">Download our Excel template with example data</p>
            </div>
            <Button variant="outline" className="border-slate-700 bg-[#1a1a1a] text-white hover:bg-slate-800" onClick={() => {
              // Basic template generation
              const ws = XLSX.utils.json_to_sheet([{ name: 'Example', code: 'EX-01', colorFamily: 'Blue', quality: 'Standard', fabricWidthCm: 140, priceInr: 1000, endUse: 'sofa', features: 'high_martindale' }]);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Template");
              XLSX.writeFile(wb, "fabric_template.xlsx");
            }}>
              <Download className="mr-2 h-4 w-4" /> Download Template
            </Button>
          </div>

          <div className="border border-red-600 rounded-md p-3 bg-[#1e1e1e] flex items-center">
            <span className="text-sm text-white font-medium mr-2">Choose File</span>
            <span className="text-sm text-slate-300 flex-1 truncate">{excelData.length > 0 ? "Uploaded Data" : "No file chosen"}</span>
            <Input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportExcelFile} className="absolute opacity-0 w-full cursor-pointer h-10" style={{ marginLeft: '-80px' }} />
          </div>

          {excelData.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="font-bold text-white">Preview (first {Math.min(5, excelData.length)} rows)</h4>
              <div className="overflow-x-auto border border-slate-700 rounded-md">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-xs text-white font-semibold bg-[#2a2a2a] sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Color</th>
                      <th className="px-4 py-3">Quality</th>
                      <th className="px-4 py-3">Width</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">End Use</th>
                      <th className="px-4 py-3">Features</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-[#1a1a1a]">
                    {excelData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3">{row.name || '-'}</td>
                        <td className="px-4 py-3">{row.code || '-'}</td>
                        <td className="px-4 py-3">{row.colorFamily || '-'}</td>
                        <td className="px-4 py-3">{row.quality || '-'}</td>
                        <td className="px-4 py-3">{row.fabricWidthCm || '-'}</td>
                        <td className="px-4 py-3">₹{row.priceInr || '-'}</td>
                        <td className="px-4 py-3">{row.endUse || '-'}</td>
                        <td className="px-4 py-3">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                 <Button variant="outline" onClick={() => { setIsImportExcelModalOpen(false); setExcelData([]); }} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</Button>
                 <Button onClick={handleSaveImportedExcel} disabled={isImporting} className="bg-red-600 hover:bg-red-700 text-white border-0">
                  {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Import Fabrics
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Import Local Images Modal */}
      <Modal isOpen={isImportLocalModalOpen} onClose={() => { setIsImportLocalModalOpen(false); setLocalData([]); }} title="Import Fabrics from Local Drive" className="max-w-5xl">
        <div className="space-y-6 pt-2">
          <p className="text-sm text-slate-400">Select images from your computer, analyze them with AI, then save into this collection.</p>
          
          <div 
            className="border-2 border-dashed border-slate-700 rounded-lg p-10 flex flex-col items-center justify-center text-center space-y-4 hover:bg-slate-800/50 transition-colors"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleLocalImageSelect({ target: { files: e.dataTransfer.files } } as any); }}
          >
            <HardDrive className="h-8 w-8 text-slate-500" />
            <p className="text-sm text-slate-300">Drag & drop images here, or click to browse (max 50)</p>
            <Input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleLocalImageSelect} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploadingLocal} variant="outline" className="bg-transparent border-slate-600 text-white hover:bg-slate-800">
              {isUploadingLocal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Select images
            </Button>
          </div>

          {localData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">{localData.length} images ready</h4>
                  <p className="text-xs text-slate-400">Click Analyze to detect fabric properties</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleAnalyzeAll} disabled={isAnalyzingLocal} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800">
                    {isAnalyzingLocal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />} Analyze All
                  </Button>
                  <Button onClick={handleSaveLocalImports} disabled={isImporting || isAnalyzingLocal} className="bg-slate-700 hover:bg-slate-600 text-white border-0">
                    {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HardDrive className="mr-2 h-4 w-4" />} Save to Collection
                  </Button>
                </div>
              </div>
              
              <div className="border border-slate-800 rounded-md overflow-hidden">
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="text-xs font-semibold text-white bg-[#2a2a2a] sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 w-16">Image</th>
                        <th className="px-4 py-3 w-[20%]">Name</th>
                        <th className="px-4 py-3 w-[15%]">Code</th>
                        <th className="px-4 py-3">Color</th>
                        <th className="px-4 py-3">Quality</th>
                        <th className="px-4 py-3">Tags</th>
                        <th className="px-4 py-3">End Use</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-[#1a1a1a]">
                      {localData.map((fabric, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3">
                            <img src={getImageUrl(fabric.textureUrl)} className="w-10 h-10 object-cover rounded bg-slate-800" />
                          </td>
                          <td className="px-2 py-3">
                            <Input value={fabric.name} onChange={e => handleLocalRowChange(idx, 'name', e.target.value)} className="h-8 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-slate-600 shadow-none px-2" />
                          </td>
                          <td className="px-2 py-3">
                            <Input value={fabric.code} onChange={e => handleLocalRowChange(idx, 'code', e.target.value)} className="h-8 text-xs bg-transparent border-none focus-visible:ring-1 focus-visible:ring-slate-600 shadow-none px-2" />
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{fabric.colorFamily || '-'}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{fabric.quality || '-'}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{fabric.tags ? fabric.tags.join(', ') : '-'}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{fabric.endUse || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">{fabric.analyzed ? 'Ready' : 'Waiting'}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => setLocalData(localData.filter((_, i) => i !== idx))} className="text-slate-500 hover:text-red-400 transition-colors">✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          <div className="pt-2 flex justify-end">
            <Button variant="outline" onClick={() => { setIsImportLocalModalOpen(false); setLocalData([]); }} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800">Close</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!fabricToDelete} onClose={() => setFabricToDelete(null)} title="Delete Fabric">
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-400">Are you sure you want to permanently delete <strong>{fabricToDelete?.name}</strong>?</p>
          <div className="pt-4 flex justify-end gap-2 border-t border-slate-800 mt-4">
            <Button variant="ghost" onClick={() => setFabricToDelete(null)} className="text-slate-300">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-600">Delete</Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Modal (Feature 6 completeness) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Fabric' : 'Add Fabric'}>
        <form onSubmit={handleSave} className="space-y-4 pt-2 max-h-[80vh] overflow-y-auto px-1 text-slate-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Name *</Label>
              <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="ALPHA 910" className="bg-transparent border-slate-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Code *</Label>
              <Input required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="DF103A7943" className="bg-transparent border-slate-700 text-white" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-slate-300">Category *</Label>
            <select className="flex h-10 w-full items-center justify-between rounded-md border border-slate-700 bg-[#1e1e1e] px-3 py-2 text-sm text-white" value={formData.endUse} onChange={e => setFormData({ ...formData, endUse: e.target.value })}>
              <option value="sofa">Sofa</option>
              <option value="curtain">Curtain</option>
              <option value="rug">Rug</option>
              <option value="wallpaper">Wallpaper</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Fabric Image *</Label>
            <Input type="file" accept="image/*" onChange={handleImageUpload} className="bg-transparent border-slate-700 text-slate-300 cursor-pointer" />
            {formData.textureUrl && <p className="text-xs text-green-500">Image loaded.</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Color Family</Label>
              <Input value={formData.colorFamily} onChange={e => setFormData({ ...formData, colorFamily: e.target.value })} placeholder="Gray" className="bg-transparent border-slate-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Quality</Label>
              <Input value={formData.quality} onChange={e => setFormData({ ...formData, quality: e.target.value })} placeholder="Standard" className="bg-transparent border-slate-700 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Tags (comma-separated)</Label>
            <Input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="textured, geometric, modern" className="bg-transparent border-slate-700 text-white" />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-slate-300">Repeat Width (mm)</Label>
              <Input type="number" value={formData.repeatWidthMm} onChange={e => setFormData({ ...formData, repeatWidthMm: e.target.value })} className="bg-transparent border-slate-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-300">Repeat Height (mm)</Label>
              <Input type="number" value={formData.repeatHeightMm} onChange={e => setFormData({ ...formData, repeatHeightMm: e.target.value })} className="bg-transparent border-slate-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-300">Fabric Width (cm)</Label>
              <Input type="number" value={formData.fabricWidthCm} onChange={e => setFormData({ ...formData, fabricWidthCm: e.target.value })} placeholder="e.g. 140" className="bg-transparent border-slate-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-slate-300">Price (₹ INR)</Label>
              <Input type="number" value={formData.priceInr} onChange={e => setFormData({ ...formData, priceInr: e.target.value })} placeholder="855" className="bg-transparent border-slate-700 text-white" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} className="rounded border-slate-700 bg-[#1e1e1e] w-4 h-4" />
            <Label htmlFor="active" className="font-semibold text-white cursor-pointer">Active</Label>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800">
            <Label className="font-semibold text-white">Fabric Features</Label>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {['highMartindale', 'waterRepellent', 'antimicrobial', 'fadeResistant', 'stainRepellent', 'premiumQuality'].map(feat => (
                <div key={feat} className="flex items-center gap-2">
                  <input type="checkbox" id={feat} checked={(formData.featureFlags as any)[feat]} onChange={e => setFormData({ ...formData, featureFlags: { ...formData.featureFlags, [feat]: e.target.checked }})} className="rounded border-slate-700 bg-[#1e1e1e] w-4 h-4 cursor-pointer" />
                  <Label htmlFor={feat} className="capitalize text-slate-300 cursor-pointer">{feat.replace(/([A-Z])/g, ' $1').trim()}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-800 sticky bottom-0 bg-[#0a0a0a]/90 backdrop-blur pb-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">Cancel</Button>
            <Button type="submit" disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white border-0">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null} Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
