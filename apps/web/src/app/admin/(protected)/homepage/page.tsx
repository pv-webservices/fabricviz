'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Image as ImageIcon, Save, Video, Link as LinkIcon, Type, X } from 'lucide-react';
import { SortableList } from '@/components/admin/SortableList';

const TABS = [
  { id: 'header', label: 'Header Menu' },
  { id: 'hero_banners', label: 'Hero Banners' },
  { id: 'running_bar', label: 'Running Bar' },
  { id: 'stats_bar', label: 'Stats Bar' },
  { id: 'masonry_grid', label: 'Masonry Grid' },
  { id: 'home_textiles_carousel', label: 'Textiles Carousel' }
];

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function HomepageEditor() {
  const [activeTab, setActiveTab] = useState('header');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // State for each section
  const [headerData, setHeaderData] = useState<any>({ logo_text: '', menu_items: [] });
  const [heroData, setHeroData] = useState<any>({ items: [] });
  const [runningData, setRunningData] = useState<any>({ text: '' });
  const [statsData, setStatsData] = useState<any>({ stats: [] });
  const [masonryData, setMasonryData] = useState<any>({ tagLabel: '', sectionTitle: '', subheading: '', items: [] });
  const [carouselData, setCarouselData] = useState<any>({ tagLabel: '', sectionTitle: '', subtitle: '', cards: [] });
  const [collections, setCollections] = useState<any[]>([]);

  const loadCollections = useCallback(async () => {
    try {
      const data = await fetchApi<{ items: any[] }>('/api/collections?limit=100', { requireAuth: true });
      setCollections(data.items || []);
    } catch (err) {
      console.error('Failed to load collections', err);
    }
  }, []);

  const loadData = useCallback(async (section: string) => {
    setLoading(true);
    try {
      const data = await fetchApi(`/api/homepage/${section}`, { requireAuth: true });
      if (section === 'header') setHeaderData(data || { logo_text: '', menu_items: [] });
      if (section === 'hero_banners') setHeroData(data || { items: [] });
      if (section === 'running_bar') setRunningData(data || { text: '' });
      if (section === 'stats_bar') setStatsData(data || { stats: [] });
      if (section === 'masonry_grid') setMasonryData(data || { tagLabel: '', sectionTitle: '', subheading: '', items: [] });
      if (section === 'home_textiles_carousel') setCarouselData(data || { tagLabel: '', sectionTitle: '', subtitle: '', cards: [] });
    } catch (err) {
      console.error(`Failed to load ${section}`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(activeTab);
    if (activeTab === 'header' && collections.length === 0) {
      loadCollections();
    }
  }, [activeTab, loadData, loadCollections, collections.length]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let payload;
      if (activeTab === 'header') payload = headerData;
      if (activeTab === 'hero_banners') payload = heroData;
      if (activeTab === 'running_bar') payload = runningData;
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
                collections={collections}
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
            {activeTab === 'running_bar' && (
              <RunningBarEditor 
                data={runningData} 
                onChange={setRunningData} 
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

function HeaderEditor({ data, onChange, onUpload, generateId, collections }: any) {
  const addMenuItem = () => {
    onChange({
      ...data,
      menu_items: [...(data.menu_items || []), { id: generateId(), name: '', href: '', submenu: [] }]
    });
  };

  const updateMenuItem = (id: string, updates: any) => {
    onChange({
      ...data,
      menu_items: (data.menu_items || []).map((item: any) => item.id === id ? { ...item, ...updates } : item)
    });
  };

  const removeMenuItem = (id: string) => {
    onChange({
      ...data,
      menu_items: (data.menu_items || []).filter((item: any) => item.id !== id)
    });
  };

  const addSubmenuItem = (parentId: string) => {
    onChange({
      ...data,
      menu_items: (data.menu_items || []).map((item: any) => {
        if (item.id === parentId) {
          return { ...item, submenu: [...(item.submenu || []), { name: '', href: '' }] };
        }
        return item;
      })
    });
  };

  const updateSubmenuItem = (parentId: string, index: number, updates: any) => {
    onChange({
      ...data,
      menu_items: (data.menu_items || []).map((item: any) => {
        if (item.id === parentId) {
          const newSubmenu = [...(item.submenu || [])];
          newSubmenu[index] = { ...newSubmenu[index], ...updates };
          return { ...item, submenu: newSubmenu };
        }
        return item;
      })
    });
  };

  const removeSubmenuItem = (parentId: string, index: number) => {
    onChange({
      ...data,
      menu_items: (data.menu_items || []).map((item: any) => {
        if (item.id === parentId) {
          const newSubmenu = [...(item.submenu || [])];
          newSubmenu.splice(index, 1);
          return { ...item, submenu: newSubmenu };
        }
        return item;
      })
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Logo Image</Label>
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Upload from local drive</Label>
            <Input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                onUpload(e, (url: string) => {
                  onChange({...data, logo_url: url});
                });
              }}
            />
          </div>
          <div className="w-32 h-10 border rounded overflow-hidden flex items-center justify-center bg-gray-50 relative">
            {data.logo_url ? (
              <img src={getImageUrl(data.logo_url)} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-xs text-muted-foreground">Preview</span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Menu Items</Label>
          <Button variant="outline" size="sm" onClick={addMenuItem}><Plus className="h-4 w-4 mr-2"/> Add Link</Button>
        </div>
        {(!data.menu_items || data.menu_items.length === 0) ? (
          <p className="text-sm text-muted-foreground">No menu items added.</p>
        ) : (
          <SortableList
            items={data.menu_items}
            onReorder={(newItems) => onChange({ ...data, menu_items: newItems })}
            renderItem={(item: any) => (
              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1 space-y-1">
                    <Input 
                      placeholder="Name (e.g. Collections)" 
                      value={item.name} 
                      onChange={e => updateMenuItem(item.id, { name: e.target.value })} 
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Input 
                      placeholder="URL (e.g. /collections)" 
                      value={item.href} 
                      onChange={e => updateMenuItem(item.id, { href: e.target.value })} 
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeMenuItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Submenu editor */}
                <div className="pl-8 w-full space-y-2 border-l-2 ml-2 border-slate-200 py-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-500">Submenu Items</Label>
                    <Button variant="ghost" size="sm" onClick={() => addSubmenuItem(item.id)} className="h-6 text-xs"><Plus className="h-3 w-3 mr-1"/> Add Sublink</Button>
                  </div>
                  {(item.submenu || []).map((sub: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        className="h-8 text-sm rounded-md border border-input bg-background px-2 focus:ring-2 focus:ring-slate-900 min-w-[140px]"
                        onChange={e => {
                          const selected = collections?.find((c: any) => c.id === e.target.value);
                          if (selected) {
                            updateSubmenuItem(item.id, i, { 
                              name: selected.name, 
                              href: `/collections/${selected.id}` 
                            });
                          }
                        }}
                        value=""
                      >
                        <option value="" disabled>Link Collection...</option>
                        {collections?.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <Input placeholder="Subname" className="h-8 text-sm flex-1" value={sub.name} onChange={e => updateSubmenuItem(item.id, i, { name: e.target.value })} />
                      <Input placeholder="URL" className="h-8 text-sm flex-1" value={sub.href} onChange={e => updateSubmenuItem(item.id, i, { href: e.target.value })} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 shrink-0" onClick={() => removeSubmenuItem(item.id, i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
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
      items: [...(data.items || []), { id: generateId(), type: 'image', mediaUrl: '', tagLabel: '', headline: '', subtext: '', cta1_text: '', cta1_link: '', cta2_text: '', cta2_link: '' }]
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
            <div className="flex gap-4 w-full flex-col sm:flex-row items-start bg-slate-50 p-4 border rounded">
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
                    <div className="h-24 bg-slate-200 flex items-center justify-center rounded border text-xs text-slate-500 overflow-hidden relative">
                      <video src={getImageUrl(item.mediaUrl)} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                      <Video className="h-6 w-6 z-10" />
                    </div>
                  ) : (
                    <img src={getImageUrl(item.mediaUrl)} alt="Preview" className="h-24 w-full object-cover rounded border" />
                  )
                )}
              </div>
              <div className="flex-1 space-y-3 w-full">
                <Input placeholder="Tag Label (e.g. Premium Textiles)" value={item.tagLabel} onChange={e => updateItem(item.id, { tagLabel: e.target.value })} />
                <Input placeholder="Headline" value={item.headline} onChange={e => updateItem(item.id, { headline: e.target.value })} />
                <Input placeholder="Subtext" value={item.subtext} onChange={e => updateItem(item.id, { subtext: e.target.value })} />
                
                <div className="grid grid-cols-2 gap-4 border-t pt-3 mt-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Primary CTA</Label>
                    <Input placeholder="Button Text" value={item.cta1_text} onChange={e => updateItem(item.id, { cta1_text: e.target.value })} />
                    <Input placeholder="Button URL" value={item.cta1_link} onChange={e => updateItem(item.id, { cta1_link: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Secondary CTA</Label>
                    <Input placeholder="Button Text" value={item.cta2_text} onChange={e => updateItem(item.id, { cta2_text: e.target.value })} />
                    <Input placeholder="Button URL" value={item.cta2_link} onChange={e => updateItem(item.id, { cta2_link: e.target.value })} />
                  </div>
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

function RunningBarEditor({ data, onChange }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Running Bar Text</Label>
        <p className="text-sm text-slate-500">Enter the text for the marquee. Use bullet points or symbols like • to separate items.</p>
        <textarea 
          className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900"
          placeholder="Velvet • Chenille • Jacquard • Linen"
          value={data.text || ''}
          onChange={e => onChange({ ...data, text: e.target.value })}
        />
      </div>
    </div>
  );
}

function StatsEditor({ data, onChange, generateId }: any) {
  const addStat = () => {
    onChange({
      ...data,
      stats: [...(data.stats || []), { id: generateId(), icon: '', title: '', subtitle: '', active: true }]
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
                <Input placeholder="Icon Name (e.g. Shield, Leaf)" value={item.icon} onChange={e => updateStat(item.id, { icon: e.target.value })} />
              </div>
              <div className="flex-1 space-y-1">
                <Input placeholder="Title (e.g. 50+ Countries)" value={item.title} onChange={e => updateStat(item.id, { title: e.target.value })} />
              </div>
              <div className="flex-1 space-y-1">
                <Input placeholder="Subtitle (e.g. WORLDWIDE)" value={item.subtitle} onChange={e => updateStat(item.id, { subtitle: e.target.value })} />
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded border">
        <div className="space-y-2">
          <Label>Tag Label</Label>
          <Input placeholder="e.g. Our Categories" value={data.tagLabel} onChange={e => onChange({ ...data, tagLabel: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Section Title</Label>
          <Input placeholder="e.g. Product Collections" value={data.sectionTitle} onChange={e => onChange({ ...data, sectionTitle: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Subheading</Label>
          <Input placeholder="e.g. Life should be Chic..." value={data.subheading} onChange={e => onChange({ ...data, subheading: e.target.value })} />
        </div>
      </div>

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
                {item.mediaUrl && <img src={getImageUrl(item.mediaUrl)} alt="Preview" className="h-24 w-full object-cover rounded border" />}
              </div>
              <div className="flex-1 space-y-3 w-full">
                <div className="flex gap-2">
                  <select 
                    className="w-1/3 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900"
                    value={item.type}
                    onChange={e => updateItem(item.id, { type: e.target.value })}
                  >
                    <option value="image">Image Item</option>
                    <option value="text">Text Box Item</option>
                  </select>
                  <select 
                    className="w-2/3 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900"
                    value={item.span_preset || ''}
                    onChange={e => updateItem(item.id, { span_preset: e.target.value })}
                  >
                    <option value="">Default Span</option>
                    <option value="horizontal">Horizontal (Wide)</option>
                    <option value="vertical">Vertical (Tall)</option>
                    <option value="square">Square (Small)</option>
                    <option value="text_dark">Dark Text Box</option>
                    <option value="text_light">Light Text Box</option>
                  </select>
                </div>
                
                {item.type === 'text' ? (
                  <>
                    <Input placeholder="Title" value={item.title || ''} onChange={e => updateItem(item.id, { title: e.target.value })} />
                    <Input placeholder="Subtitle" value={item.subtitle || ''} onChange={e => updateItem(item.id, { subtitle: e.target.value })} />
                  </>
                ) : (
                  <Input placeholder="Alt Text" value={item.alt || ''} onChange={e => updateItem(item.id, { alt: e.target.value })} />
                )}
              </div>
              <Button variant="ghost" size="icon" className="text-red-500 mt-1 shrink-0" onClick={() => removeItem(item.id)}>
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

function CarouselEditor({ data, onChange, onUpload, generateId }: any) {
  const addCard = () => {
    onChange({
      ...data,
      cards: [...(data.cards || []), { id: generateId(), mediaUrl: '', title: '', text: '', ctaText: '', linkUrl: '' }]
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded border">
        <div className="space-y-2">
          <Label>Tag Label</Label>
          <Input placeholder="e.g. Home Textiles" value={data.tagLabel || ''} onChange={e => onChange({ ...data, tagLabel: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Section Title</Label>
          <Input placeholder="e.g. Our Collection" value={data.sectionTitle || ''} onChange={e => onChange({ ...data, sectionTitle: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Subtitle</Label>
          <Input placeholder="e.g. From upholstery..." value={data.subtitle || ''} onChange={e => onChange({ ...data, subtitle: e.target.value })} />
        </div>
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
                  {item.mediaUrl && <img src={getImageUrl(item.mediaUrl)} alt="Preview" className="h-24 w-full object-cover rounded border" />}
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <Input placeholder="Title" value={item.title} onChange={e => updateCard(item.id, { title: e.target.value })} />
                  <Input placeholder="Text / Code" value={item.text} onChange={e => updateCard(item.id, { text: e.target.value })} />
                  <div className="flex gap-2">
                    <Input placeholder="CTA Text" value={item.ctaText} onChange={e => updateCard(item.id, { ctaText: e.target.value })} />
                    <Input placeholder="Link URL" value={item.linkUrl} onChange={e => updateCard(item.id, { linkUrl: e.target.value })} />
                  </div>
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
