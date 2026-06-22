'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Image as ImageIcon, Save, Video, Link as LinkIcon, Type } from 'lucide-react';
import { SortableList } from '@/components/admin/SortableList';

const TABS = [
  { id: 'header', label: 'Header Menu' },
  { id: 'hero_banners', label: 'Hero Banners' },
  { id: 'stats_bar', label: 'Stats Bar' },
  { id: 'masonry_grid', label: 'Masonry Grid' },
  { id: 'home_textiles_carousel', label: 'Textiles Carousel' }
];

export default function HomepageEditor() {
  const [activeTab, setActiveTab] = useState('header');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // State for each section
  const [headerData, setHeaderData] = useState<any>({ logo: '', menuItems: [] });
  const [heroData, setHeroData] = useState<any>({ items: [] });
  const [statsData, setStatsData] = useState<any>({ stats: [] });
  const [masonryData, setMasonryData] = useState<any>({ items: [] });
  const [carouselData, setCarouselData] = useState<any>({ title: '', cards: [] });

  const loadData = useCallback(async (section: string) => {
    setLoading(true);
    try {
      const data = await fetchApi(`/api/homepage/${section}`, { requireAuth: true });
      if (section === 'header') setHeaderData(data || { logo: '', menuItems: [] });
      if (section === 'hero_banners') setHeroData(data || { items: [] });
      if (section === 'stats_bar') setStatsData(data || { stats: [] });
      if (section === 'masonry_grid') setMasonryData(data || { items: [] });
      if (section === 'home_textiles_carousel') setCarouselData(data || { title: '', cards: [] });
    } catch (err) {
      console.error(`Failed to load ${section}`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, loadData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let payload;
      if (activeTab === 'header') payload = headerData;
      if (activeTab === 'hero_banners') payload = heroData;
      if (activeTab === 'stats_bar') payload = statsData;
      if (activeTab === 'masonry_grid') payload = masonryData;
      if (activeTab === 'home_textiles_carousel') payload = carouselData;

      await fetchApi(`/api/homepage/${activeTab}`, {
        method: 'PUT',
        requireAuth: true,
        body: JSON.stringify(payload)
      });
      toast({ title: 'Success', description: 'Changes saved successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const token = getAuthToken();
    const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/uploads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Upload failed');
    return json.data.url;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const url = await uploadFile(e.target.files[0]);
        callback(url);
        toast({ title: 'Success', description: 'File uploaded successfully' });
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      }
    }
  };

  const generateId = () => Math.random().toString(36).substring(2, 9);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Homepage Editor</h1>
          <p className="text-muted-foreground mt-1">Manage the content on the public homepage.</p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
        </Button>
      </div>

      <div className="flex border-b">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-slate-900 text-slate-900' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm min-h-[400px]">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
          </div>
        ) : (
          <>
            {activeTab === 'header' && (
              <HeaderEditor 
                data={headerData} 
                onChange={setHeaderData} 
                onUpload={handleFileUpload} 
                generateId={generateId} 
              />
            )}
            {activeTab === 'hero_banners' && (
              <HeroEditor 
                data={heroData} 
                onChange={setHeroData} 
                onUpload={handleFileUpload} 
                generateId={generateId} 
              />
            )}
            {activeTab === 'stats_bar' && (
              <StatsEditor 
                data={statsData} 
                onChange={setStatsData} 
                generateId={generateId} 
              />
            )}
            {activeTab === 'masonry_grid' && (
              <MasonryEditor 
                data={masonryData} 
                onChange={setMasonryData} 
                onUpload={handleFileUpload} 
                generateId={generateId} 
              />
            )}
            {activeTab === 'home_textiles_carousel' && (
              <CarouselEditor 
                data={carouselData} 
                onChange={setCarouselData} 
                onUpload={handleFileUpload} 
                generateId={generateId} 
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------- Editors ----------------

function HeaderEditor({ data, onChange, onUpload, generateId }: any) {
  const addMenuItem = () => {
    onChange({
      ...data,
      menuItems: [...(data.menuItems || []), { id: generateId(), label: '', url: '' }]
    });
  };

  const updateMenuItem = (id: string, updates: any) => {
    onChange({
      ...data,
      menuItems: (data.menuItems || []).map((item: any) => item.id === id ? { ...item, ...updates } : item)
    });
  };

  const removeMenuItem = (id: string) => {
    onChange({
      ...data,
      menuItems: (data.menuItems || []).filter((item: any) => item.id !== id)
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Logo Image</Label>
        <div className="flex items-center gap-4">
          <Input 
            type="file" 
            accept="image/*"
            onChange={(e) => onUpload(e, (url: string) => onChange({ ...data, logo: url }))} 
            className="max-w-md"
          />
          {data.logo && <img src={data.logo} alt="Logo" className="h-12 object-contain border bg-slate-50 p-2 rounded" />}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Menu Items</Label>
          <Button variant="outline" size="sm" onClick={addMenuItem}><Plus className="h-4 w-4 mr-2"/> Add Link</Button>
        </div>
        {(!data.menuItems || data.menuItems.length === 0) ? (
          <p className="text-sm text-muted-foreground">No menu items added.</p>
        ) : (
          <SortableList
            items={data.menuItems}
            onReorder={(newItems) => onChange({ ...data, menuItems: newItems })}
            renderItem={(item: any) => (
              <div className="flex items-center gap-3 w-full">
                <div className="flex-1 space-y-1">
                  <Input 
                    placeholder="Label (e.g. Collections)" 
                    value={item.label} 
                    onChange={e => updateMenuItem(item.id, { label: e.target.value })} 
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Input 
                    placeholder="URL (e.g. /collections)" 
                    value={item.url} 
                    onChange={e => updateMenuItem(item.id, { url: e.target.value })} 
                  />
                </div>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeMenuItem(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}

function HeroEditor({ data, onChange, onUpload, generateId }: any) {
  const addItem = () => {
    onChange({
      ...data,
      items: [...(data.items || []), { id: generateId(), type: 'image', mediaUrl: '', title: '', subtitle: '', buttonText: '', buttonUrl: '' }]
    });
  };

  const updateItem = (id: string, updates: any) => {
    onChange({
      ...data,
      items: (data.items || []).map((item: any) => item.id === id ? { ...item, ...updates } : item)
    });
  };

  const removeItem = (id: string) => {
    onChange({
      ...data,
      items: (data.items || []).filter((item: any) => item.id !== id)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Banners</Label>
        <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-2"/> Add Banner</Button>
      </div>
      {(!data.items || data.items.length === 0) ? (
        <p className="text-sm text-muted-foreground">No banners added.</p>
      ) : (
        <SortableList
          items={data.items}
          onReorder={(newItems) => onChange({ ...data, items: newItems })}
          renderItem={(item: any) => (
            <div className="flex gap-4 w-full flex-col sm:flex-row items-start">
              <div className="w-full sm:w-48 space-y-2 shrink-0">
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900"
                  value={item.type}
                  onChange={e => updateItem(item.id, { type: e.target.value })}
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
                <Input 
                  type="file" 
                  accept={item.type === 'image' ? 'image/*' : 'video/*'}
                  onChange={(e) => onUpload(e, (url: string) => updateItem(item.id, { mediaUrl: url }))} 
                />
                {item.mediaUrl && (
                  item.type === 'video' ? (
                    <div className="h-24 bg-slate-100 flex items-center justify-center rounded border text-xs text-slate-500 overflow-hidden relative">
                      <video src={item.mediaUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                      <Video className="h-6 w-6 z-10" />
                    </div>
                  ) : (
                    <img src={item.mediaUrl} alt="Preview" className="h-24 w-full object-cover rounded border" />
                  )
                )}
              </div>
              <div className="flex-1 space-y-3 w-full">
                <Input placeholder="Title" value={item.title} onChange={e => updateItem(item.id, { title: e.target.value })} />
                <Input placeholder="Subtitle" value={item.subtitle} onChange={e => updateItem(item.id, { subtitle: e.target.value })} />
                <div className="flex gap-2">
                  <Input placeholder="Button Text" value={item.buttonText} onChange={e => updateItem(item.id, { buttonText: e.target.value })} />
                  <Input placeholder="Button URL" value={item.buttonUrl} onChange={e => updateItem(item.id, { buttonUrl: e.target.value })} />
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-red-500 mt-1 shrink-0" onClick={() => removeItem(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      )}
    </div>
  );
}

function StatsEditor({ data, onChange, generateId }: any) {
  const addStat = () => {
    onChange({
      ...data,
      stats: [...(data.stats || []), { id: generateId(), value: '', label: '' }]
    });
  };

  const updateStat = (id: string, updates: any) => {
    onChange({
      ...data,
      stats: (data.stats || []).map((item: any) => item.id === id ? { ...item, ...updates } : item)
    });
  };

  const removeStat = (id: string) => {
    onChange({
      ...data,
      stats: (data.stats || []).filter((item: any) => item.id !== id)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Stats</Label>
        <Button variant="outline" size="sm" onClick={addStat}><Plus className="h-4 w-4 mr-2"/> Add Stat</Button>
      </div>
      {(!data.stats || data.stats.length === 0) ? (
        <p className="text-sm text-muted-foreground">No stats added.</p>
      ) : (
        <SortableList
          items={data.stats}
          onReorder={(newItems) => onChange({ ...data, stats: newItems })}
          renderItem={(item: any) => (
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 space-y-1">
                <Input placeholder="Value (e.g. 50+)" value={item.value} onChange={e => updateStat(item.id, { value: e.target.value })} />
              </div>
              <div className="flex-1 space-y-1">
                <Input placeholder="Label (e.g. Countries)" value={item.label} onChange={e => updateStat(item.id, { label: e.target.value })} />
              </div>
              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeStat(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      )}
    </div>
  );
}

function MasonryEditor({ data, onChange, onUpload, generateId }: any) {
  const addItem = () => {
    onChange({
      ...data,
      items: [...(data.items || []), { id: generateId(), type: 'small', mediaUrl: '', overlayText: '', linkUrl: '' }]
    });
  };

  const updateItem = (id: string, updates: any) => {
    onChange({
      ...data,
      items: (data.items || []).map((item: any) => item.id === id ? { ...item, ...updates } : item)
    });
  };

  const removeItem = (id: string) => {
    onChange({
      ...data,
      items: (data.items || []).filter((item: any) => item.id !== id)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Masonry Grid Items</Label>
        <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-2"/> Add Grid Item</Button>
      </div>
      {(!data.items || data.items.length === 0) ? (
        <p className="text-sm text-muted-foreground">No grid items added.</p>
      ) : (
        <SortableList
          items={data.items}
          onReorder={(newItems) => onChange({ ...data, items: newItems })}
          renderItem={(item: any) => (
            <div className="flex gap-4 w-full flex-col sm:flex-row items-start">
              <div className="w-full sm:w-32 space-y-2 shrink-0">
                <Input type="file" accept="image/*" onChange={(e) => onUpload(e, (url: string) => updateItem(item.id, { mediaUrl: url }))} />
                {item.mediaUrl && <img src={item.mediaUrl} alt="Preview" className="h-24 w-full object-cover rounded border" />}
              </div>
              <div className="flex-1 space-y-3 w-full">
                <div className="flex gap-2">
                  <select 
                    className="w-1/3 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900"
                    value={item.type}
                    onChange={e => updateItem(item.id, { type: e.target.value })}
                  >
                    <option value="small">Small Span</option>
                    <option value="large">Large Span</option>
                  </select>
                  <Input className="w-2/3" placeholder="Overlay Text" value={item.overlayText} onChange={e => updateItem(item.id, { overlayText: e.target.value })} />
                </div>
                <Input placeholder="Link URL" value={item.linkUrl} onChange={e => updateItem(item.id, { linkUrl: e.target.value })} />
              </div>
              <Button variant="ghost" size="icon" className="text-red-500 mt-1 shrink-0" onClick={() => removeItem(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      )}
    </div>
  );
}

function CarouselEditor({ data, onChange, onUpload, generateId }: any) {
  const addCard = () => {
    onChange({
      ...data,
      cards: [...(data.cards || []), { id: generateId(), mediaUrl: '', title: '', linkUrl: '' }]
    });
  };

  const updateCard = (id: string, updates: any) => {
    onChange({
      ...data,
      cards: (data.cards || []).map((item: any) => item.id === id ? { ...item, ...updates } : item)
    });
  };

  const removeCard = (id: string) => {
    onChange({
      ...data,
      cards: (data.cards || []).filter((item: any) => item.id !== id)
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 max-w-md">
        <Label>Section Title</Label>
        <Input 
          placeholder="e.g. Explore Home Textiles" 
          value={data.title || ''} 
          onChange={e => onChange({ ...data, title: e.target.value })} 
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Carousel Cards</Label>
          <Button variant="outline" size="sm" onClick={addCard}><Plus className="h-4 w-4 mr-2"/> Add Card</Button>
        </div>
        {(!data.cards || data.cards.length === 0) ? (
          <p className="text-sm text-muted-foreground">No cards added.</p>
        ) : (
          <SortableList
            items={data.cards}
            onReorder={(newItems) => onChange({ ...data, cards: newItems })}
            renderItem={(item: any) => (
              <div className="flex gap-4 w-full flex-col sm:flex-row items-start">
                <div className="w-full sm:w-32 space-y-2 shrink-0">
                  <Input type="file" accept="image/*" onChange={(e) => onUpload(e, (url: string) => updateCard(item.id, { mediaUrl: url }))} />
                  {item.mediaUrl && <img src={item.mediaUrl} alt="Preview" className="h-24 w-full object-cover rounded border" />}
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <Input placeholder="Title" value={item.title} onChange={e => updateCard(item.id, { title: e.target.value })} />
                  <Input placeholder="Link URL" value={item.linkUrl} onChange={e => updateCard(item.id, { linkUrl: e.target.value })} />
                </div>
                <Button variant="ghost" size="icon" className="text-red-500 mt-1 shrink-0" onClick={() => removeCard(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
