import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { fetchApi } from '@/lib/api';
import { 
  Users, Search, ChevronDown, ChevronUp, Check, X, ShieldAlert,
  Flame, LayoutGrid, LayoutList, Tag, Download, Copy, MessageCircle, 
  Pencil, Trash2, BarChart2, Plus, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { exportCustomersToCSV } from '@/utils/exportCsv';
import { TagInput } from '@/components/admin/TagInput';

// --- Types ---
interface Customer {
  id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  country_code: string | null;
  company: string | null;
  city: string | null;
  is_active: boolean;
  created_at: string;
  session_count: number;
  last_active_at: string | null;
  tags: string[];
}

interface DuplicateGroup {
  group_id: string;
  customers: Customer[];
}

export default function CustomersPage() {
  // --- State: Data ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // --- State: Filters & View ---
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'zero' | 'has' | 'highest' | 'latest'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [logoFilter, setLogoFilter] = useState<'all' | 'with' | 'without'>('all');
  
  // Tags filter
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [tagFilterInput, setTagFilterInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // --- State: Dropdowns ---
  const [openDropdown, setOpenDropdown] = useState<'session' | 'logo' | 'status' | null>(null);

  // --- State: Modals ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isDuplicatesModalOpen, setIsDuplicatesModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  // Modal Context Data
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [mergeGroup, setMergeGroup] = useState<DuplicateGroup | null>(null);
  const [mergeKeepId, setMergeKeepId] = useState<string>('');
  
  // Add/Edit Form State
  const [formData, setFormData] = useState({
    full_name: '', email: '', mobile: '', country_code: '', company: '', city: '', tags: [] as string[], is_active: true
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(''); // E.g. to show temp password

  // --- Effects ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [page, debouncedSearch, sessionFilter, statusFilter, selectedTags]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const tagQuery = selectedTags.length > 0 ? `&tags=${encodeURIComponent(selectedTags.join(','))}` : '';
      const data = await fetchApi<any>(
        `/api/admin/customers?page=${page}&limit=20&search=${encodeURIComponent(debouncedSearch)}&session_filter=${sessionFilter}&status=${statusFilter}${tagQuery}`, 
        { requireAuth: true }
      );
      setCustomers(data.data || []);
      setTotal(data.total || 0);

      // Extract unique tags from the current view to populate available tags
      if (data.data) {
        const tagsSet = new Set<string>(availableTags);
        data.data.forEach((c: Customer) => {
          (c.tags || []).forEach(t => tagsSet.add(t));
        });
        setAvailableTags(Array.from(tagsSet));
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleExport = () => {
    exportCustomersToCSV(customers);
  };

  const getDisplayCode = (id: string) => {
    return id.split('-').pop()?.substring(0, 5).toUpperCase() || 'XXXXX';
  };

  const getCountryEmoji = (code: string | null) => {
    if (!code) return '📞';
    if (code.includes('91')) return '🇮🇳';
    if (code.includes('1') && !code.includes('91')) return '🇺🇸';
    if (code.includes('44')) return '🇬🇧';
    if (code.includes('971')) return '🇦🇪';
    if (code.includes('61')) return '🇦🇺';
    return '📞';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  // --- Add / Edit Handlers ---
  const openAddModal = () => {
    setFormData({ full_name: '', email: '', mobile: '', country_code: '', company: '', city: '', tags: [], is_active: true });
    setFormError('');
    setFormSuccess('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setSelectedCustomer(c);
    setFormData({
      full_name: c.full_name || '',
      email: c.email || '',
      mobile: c.mobile || '',
      country_code: c.country_code || '',
      company: c.company || '',
      city: c.city || '',
      tags: c.tags || [],
      is_active: c.is_active
    });
    setFormError('');
    setFormSuccess('');
    setIsEditModalOpen(true);
  };

  const handleSaveCustomer = async () => {
    setFormError('');
    try {
      if (isAddModalOpen) {
        const res = await fetchApi<any>('/api/admin/customers/create', {
          method: 'POST',
          requireAuth: true,
          body: JSON.stringify(formData)
        });
        setFormSuccess(`Customer created! Temp password: ${res.tempPassword}`);
        fetchCustomers();
        // Don't close immediately so admin can copy password
      } else if (isEditModalOpen && selectedCustomer) {
        await fetchApi(`/api/admin/customers/${selectedCustomer.id}`, {
          method: 'PATCH',
          requireAuth: true,
          body: JSON.stringify(formData)
        });
        fetchCustomers();
        setIsEditModalOpen(false);
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred');
    }
  };

  // --- Delete Handlers ---
  const openDeleteModal = (c: Customer) => {
    setSelectedCustomer(c);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCustomer) return;
    try {
      await fetchApi(`/api/admin/customers/${selectedCustomer.id}`, {
        method: 'DELETE',
        requireAuth: true
      });
      fetchCustomers();
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  // --- Stats Handlers ---
  const openStatsModal = async (c: Customer) => {
    setSelectedCustomer(c);
    setIsStatsModalOpen(true);
    // Could fetch detailed stats here if needed, but we have most in the Customer object
  };

  // --- Duplicates Handlers ---
  const handleCheckDuplicates = async () => {
    try {
      const data = await fetchApi<DuplicateGroup[]>('/api/admin/customers/duplicate-check', { requireAuth: true });
      setDuplicates(data);
      setIsDuplicatesModalOpen(true);
    } catch (err) {
      console.error('Duplicate check failed', err);
    }
  };

  const openMergeModal = (group: DuplicateGroup) => {
    setMergeGroup(group);
    setMergeKeepId(group.customers[0]?.id || '');
    setIsMergeModalOpen(true);
  };

  const handleMerge = async () => {
    if (!mergeGroup || !mergeKeepId) return;
    try {
      const mergeIds = mergeGroup.customers.map(c => c.id).filter(id => id !== mergeKeepId);
      await fetchApi('/api/admin/customers/merge', {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify({ keep_id: mergeKeepId, merge_ids: mergeIds })
      });
      setIsMergeModalOpen(false);
      // Remove group from duplicates list
      setDuplicates(prev => prev.filter(g => g.group_id !== mergeGroup.group_id));
      fetchCustomers();
    } catch (err) {
      console.error('Merge failed', err);
    }
  };

  const handleTagFilterKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const tag = tagFilterInput.trim();
      if (tag && !selectedTags.includes(tag)) {
        setSelectedTags([...selectedTags, tag]);
      }
      setTagFilterInput('');
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-2 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-brand-text">Customers</h1>
          <p className="text-brand-muted text-sm mt-1">Manage customer accounts and track their activity</p>
        </div>
        <Button onClick={openAddModal} className="bg-brand-terracotta text-white hover:opacity-90 tracking-widest uppercase font-bold shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-3 bg-brand-alt/50 p-3 rounded-xl border border-black/5">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
          <Input
            placeholder="Search by name, company, phone, email, code, or tags..."
            className="pl-9 bg-white border-black/10 focus:ring-brand-accent text-brand-text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Grid/List Toggle */}
        <div className="flex items-center bg-brand-dark rounded-md p-1">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-brand-accent' : 'text-white/60 hover:text-white'}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-white/10 text-brand-accent' : 'text-white/60 hover:text-white'}`}
          >
            <LayoutList size={16} />
          </button>
        </div>

        {/* Duplicates */}
        <Button variant="outline" size="sm" onClick={handleCheckDuplicates} className="border-brand-muted/30 text-brand-text">
          Duplicates
        </Button>

        {/* Sessions Dropdown */}
        <div className="relative">
          <Button variant="outline" size="sm" onClick={() => setOpenDropdown(openDropdown === 'session' ? null : 'session')} className="border-brand-muted/30 text-brand-text min-w-[140px] justify-between">
            {sessionFilter === 'all' ? 'All Sessions' : sessionFilter === 'zero' ? 'Zero Sessions' : sessionFilter === 'has' ? 'Has Sessions' : sessionFilter === 'highest' ? 'Highest First' : 'Latest First'}
            <ChevronDown size={14} className="ml-2 opacity-50" />
          </Button>
          {openDropdown === 'session' && (
            <div className="absolute top-full mt-1 left-0 w-48 bg-white rounded-md shadow-lg border border-black/10 z-10 py-1">
              {[
                { val: 'all', label: 'All Sessions' },
                { val: 'zero', label: 'Zero Sessions' },
                { val: 'has', label: 'Has Sessions' },
                { val: 'highest', label: 'Highest First' },
                { val: 'latest', label: 'Latest First' }
              ].map(opt => (
                <button 
                  key={opt.val} 
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-alt ${sessionFilter === opt.val ? 'text-brand-accent font-medium' : 'text-brand-text'}`}
                  onClick={() => { setSessionFilter(opt.val as any); setOpenDropdown(null); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logos Dropdown (UI Only) */}
        <div className="relative">
          <Button variant="outline" size="sm" onClick={() => setOpenDropdown(openDropdown === 'logo' ? null : 'logo')} className="border-brand-muted/30 text-brand-text min-w-[120px] justify-between">
            {logoFilter === 'all' ? 'All Logos' : logoFilter === 'with' ? 'With Logo' : 'Without Logo'}
            <ChevronDown size={14} className="ml-2 opacity-50" />
          </Button>
          {openDropdown === 'logo' && (
            <div className="absolute top-full mt-1 left-0 w-40 bg-white rounded-md shadow-lg border border-black/10 z-10 py-1">
              {[
                { val: 'all', label: 'All Logos' },
                { val: 'with', label: 'With Logo' },
                { val: 'without', label: 'Without Logo' }
              ].map(opt => (
                <button 
                  key={opt.val} 
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-alt ${logoFilter === opt.val ? 'text-brand-accent font-medium' : 'text-brand-text'}`}
                  onClick={() => { setLogoFilter(opt.val as any); setOpenDropdown(null); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <Button variant="outline" size="sm" onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')} className="border-brand-muted/30 text-brand-text min-w-[120px] justify-between">
            {statusFilter === 'all' ? 'All Status' : statusFilter === 'active' ? 'Active' : 'Inactive'}
            <ChevronDown size={14} className="ml-2 opacity-50" />
          </Button>
          {openDropdown === 'status' && (
            <div className="absolute top-full mt-1 left-0 w-40 bg-white rounded-md shadow-lg border border-black/10 z-10 py-1">
              {[
                { val: 'all', label: 'All Status' },
                { val: 'active', label: 'Active' },
                { val: 'inactive', label: 'Inactive' }
              ].map(opt => (
                <button 
                  key={opt.val} 
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-alt ${statusFilter === opt.val ? 'text-brand-accent font-medium' : 'text-brand-text'}`}
                  onClick={() => { setStatusFilter(opt.val as any); setOpenDropdown(null); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tags Button */}
        <Button 
          variant={isTagFilterOpen || selectedTags.length > 0 ? "default" : "outline"} 
          size="sm" 
          onClick={() => setIsTagFilterOpen(!isTagFilterOpen)} 
          className={isTagFilterOpen || selectedTags.length > 0 ? "bg-brand-accent text-white" : "border-brand-muted/30 text-brand-text"}
        >
          <Tag size={14} className="mr-2" /> Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
        </Button>

        <div className="flex-1 flex justify-end items-center gap-4 min-w-[200px]">
          <span className="text-sm text-brand-muted">{total} customers</span>
          <Button variant="ghost" size="sm" onClick={handleExport} className="text-brand-text hover:bg-brand-alt">
            <Download size={14} className="mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* TAG FILTER PANEL */}
      {isTagFilterOpen && (
        <div className="bg-brand-alt/30 border border-black/5 p-4 rounded-xl flex flex-col gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-brand-muted" />
            <input 
              type="text" 
              placeholder="Type a tag and press Enter" 
              className="bg-transparent border-none outline-none text-sm text-brand-text flex-1"
              value={tagFilterInput}
              onChange={(e) => setTagFilterInput(e.target.value)}
              onKeyDown={handleTagFilterKeyDown}
            />
            {selectedTags.length > 0 && (
              <button onClick={() => setSelectedTags([])} className="text-xs text-brand-accent hover:underline">Clear all</button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 bg-brand-accent/20 text-brand-accent text-xs px-2 py-1 rounded-full cursor-pointer hover:bg-brand-accent/30 transition-colors" onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}>
                {tag} <X size={12} />
              </span>
            ))}
            {availableTags.filter(t => !selectedTags.includes(t)).map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 bg-white border border-black/10 text-brand-muted text-xs px-2 py-1 rounded-full cursor-pointer hover:bg-brand-alt transition-colors" onClick={() => setSelectedTags([...selectedTags, tag])}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT AREA */}
      {loading ? (
        <div className="py-20 text-center text-brand-muted flex flex-col items-center">
          <Flame className="animate-pulse mb-2 text-brand-accent" size={32} />
          Loading customers...
        </div>
      ) : customers.length === 0 ? (
        <div className="py-20 text-center text-brand-muted">
          No customers found matching your criteria.
        </div>
      ) : viewMode === 'grid' ? (
        // --- GRID VIEW ---
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map(c => {
            const displayCode = getDisplayCode(c.id);
            const isMaxSessions = c.session_count >= 30;
            return (
              <div key={c.id} className="bg-brand-dark rounded-xl p-5 flex flex-col gap-4 shadow-sm border border-white/5 hover:border-white/10 transition-colors group">
                
                {/* TOP ROW */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white">{displayCode}</span>
                    <button onClick={() => copyToClipboard(displayCode)} className="text-white/40 hover:text-white transition-colors p-1">
                      <Copy size={14} />
                    </button>
                    <button className="text-white/40 hover:text-white transition-colors p-1" title="Message (Future)">
                      <MessageCircle size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.is_active 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      isMaxSessions ? 'bg-brand-accent/20 text-brand-accent' : 
                      c.session_count > 0 ? 'bg-white/10 text-white/70' : 'bg-white/5 text-white/40'
                    }`}>
                      <Flame size={12} /> {c.session_count}/30
                    </span>
                  </div>
                </div>

                {/* INFO ROW */}
                <div>
                  <h3 className="text-white font-semibold text-base truncate">{c.full_name}</h3>
                  <p className="text-white/60 text-sm truncate">{c.company ? `${c.company}${c.city ? `, ${c.city}` : ''}` : c.city || 'No company info'}</p>
                  <p className="text-white/60 text-sm flex items-center gap-1 mt-0.5">
                    <span className="text-base">{getCountryEmoji(c.country_code)}</span>
                    {c.country_code} {c.mobile || c.email}
                  </p>
                </div>

                {/* SESSIONS / DATES ROW */}
                <div className="flex flex-col gap-0.5">
                  <p className="text-white/50 text-xs flex justify-between">
                    <span>Sessions: {c.session_count}</span>
                    <span>Created: {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </p>
                  {c.last_active_at && (
                    <p className="text-brand-accent/80 text-xs">
                      Last active: {new Date(c.last_active_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  )}
                </div>

                {/* TAGS ROW */}
                {(c.tags && c.tags.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {c.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="bg-brand-accent/15 text-brand-accent/80 text-xs px-2 py-0.5 rounded-full truncate max-w-[100px]">
                        {tag}
                      </span>
                    ))}
                    {c.tags.length > 3 && (
                      <span className="bg-brand-accent/10 text-brand-accent/60 text-xs px-2 py-0.5 rounded-full">
                        +{c.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* BOTTOM ROW (Actions) */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <button onClick={() => openStatsModal(c)} className="bg-white/5 text-white/60 hover:bg-white/15 hover:text-white transition-colors rounded-md px-3 py-1.5 text-xs flex items-center gap-1.5 font-medium">
                    <BarChart2 size={14} /> Stats
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditModal(c)} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Edit Customer">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => openDeleteModal(c)} className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Deactivate Customer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      ) : (
        // --- LIST VIEW ---
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-brand-alt border-b border-black/10 text-brand-muted uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name & Contact</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Sessions</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3">Tags</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 bg-white">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-brand-alt/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-brand-text">{getDisplayCode(c.id)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-text">{c.full_name}</div>
                      <div className="text-brand-muted text-xs">{c.email}</div>
                    </td>
                    <td className="px-4 py-3 text-brand-text">
                      <div className="truncate max-w-[150px]">{c.company || '-'}</div>
                      <div className="text-brand-muted text-xs truncate max-w-[150px]">{c.city}</div>
                    </td>
                    <td className="px-4 py-3 text-brand-text">
                      <div className="flex items-center gap-1">
                        <Flame size={12} className={c.session_count > 0 ? "text-brand-accent" : "text-brand-muted"}/> 
                        {c.session_count}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-muted text-xs">
                      {c.last_active_at ? new Date(c.last_active_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.tags || []).slice(0, 2).map(t => (
                          <span key={t} className="bg-brand-accent/10 text-brand-accent text-[10px] px-1.5 py-0.5 rounded-sm truncate max-w-[80px]">{t}</span>
                        ))}
                        {(c.tags?.length || 0) > 2 && <span className="text-brand-muted text-[10px]">+{c.tags.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                        c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openStatsModal(c)} className="h-8 w-8 text-brand-muted hover:text-brand-text">
                          <BarChart2 size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(c)} className="h-8 w-8 text-brand-muted hover:text-brand-text">
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteModal(c)} className="h-8 w-8 text-brand-muted hover:text-red-500">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-brand-muted">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="border-brand-muted/30">Previous</Button>
            <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(page + 1)} className="border-brand-muted/30">Next</Button>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      
      {/* ADD / EDIT MODAL */}
      <Modal 
        isOpen={isAddModalOpen || isEditModalOpen} 
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} 
        title={isAddModalOpen ? 'Add Customer' : 'Edit Customer'}
        className="max-w-xl"
      >
        <div className="space-y-4">
          {formError && <div className="p-3 bg-red-500/10 text-red-400 text-sm border border-red-500/20 rounded-md">{formError}</div>}
          {formSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-400 text-sm border border-emerald-500/20 rounded-md select-text">{formSuccess}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70">Full Name *</label>
              <Input className="bg-black/20 border-white/10 text-white focus:border-brand-accent" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70">Email Address *</label>
              <Input className="bg-black/20 border-white/10 text-white focus:border-brand-accent" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-medium text-white/70">Code (e.g. +91)</label>
              <Input className="bg-black/20 border-white/10 text-white focus:border-brand-accent" value={formData.country_code} onChange={e => setFormData({...formData, country_code: e.target.value})} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-medium text-white/70">Mobile Number</label>
              <Input className="bg-black/20 border-white/10 text-white focus:border-brand-accent" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70">Company</label>
              <Input className="bg-black/20 border-white/10 text-white focus:border-brand-accent" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/70">City</label>
              <Input className="bg-black/20 border-white/10 text-white focus:border-brand-accent" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/70">Tags</label>
            <div className="bg-black/20 p-2 rounded-md border border-white/10">
              <TagInput 
                value={formData.tags} 
                onChange={tags => setFormData({...formData, tags})} 
                placeholder="Type and press Enter to add tags..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-white/10 mt-4">
            <span className="text-sm text-white/80 font-medium">Account Status</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              <span className="ml-3 text-sm font-medium text-white/60">{formData.is_active ? 'Active' : 'Inactive'}</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Cancel</Button>
            <Button className="bg-brand-terracotta text-white hover:opacity-90 font-bold uppercase tracking-widest" onClick={handleSaveCustomer}>
              {isAddModalOpen ? 'Create Customer' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Deactivate Customer">
        <div className="space-y-4">
          <div className="flex gap-3 items-start p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertTriangle className="text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm text-red-100">
              <p className="font-semibold text-red-300 mb-1">Are you sure you want to deactivate {selectedCustomer?.full_name}?</p>
              <p>They will lose access immediately. This action can be undone by editing the customer and toggling their status back to Active.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button className="bg-red-500 text-white hover:bg-red-600 font-bold uppercase tracking-widest" onClick={confirmDelete}>Deactivate</Button>
          </div>
        </div>
      </Modal>

      {/* STATS MODAL */}
      <Modal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} title="Customer Stats">
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="text-white/50 text-xs mb-1 uppercase tracking-wider">Display Code</div>
                <div className="text-xl font-mono text-white font-bold">{getDisplayCode(selectedCustomer.id)}</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="text-white/50 text-xs mb-1 uppercase tracking-wider">Sessions Used</div>
                <div className="text-xl text-brand-accent font-bold flex items-center gap-2"><Flame size={20}/> {selectedCustomer.session_count}</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="text-white/50 text-xs mb-1 uppercase tracking-wider">Joined Date</div>
                <div className="text-sm text-white font-medium">{new Date(selectedCustomer.created_at).toLocaleString()}</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="text-white/50 text-xs mb-1 uppercase tracking-wider">Last Active</div>
                <div className="text-sm text-white font-medium">{selectedCustomer.last_active_at ? new Date(selectedCustomer.last_active_at).toLocaleString() : 'Never'}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white/80 border-b border-white/10 pb-2">Tags</h4>
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedCustomer.tags?.length > 0 ? selectedCustomer.tags.map(tag => (
                  <span key={tag} className="bg-brand-accent/20 text-brand-accent px-2 py-1 rounded-full text-xs">{tag}</span>
                )) : <span className="text-white/40 text-sm italic">No tags assigned.</span>}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* DUPLICATES MODAL */}
      <Modal isOpen={isDuplicatesModalOpen} onClose={() => setIsDuplicatesModalOpen(false)} title="Duplicate Customers" className="max-w-4xl">
        <div className="space-y-6">
          {duplicates.length === 0 ? (
            <div className="py-12 text-center text-white/50">
              <Check className="mx-auto h-12 w-12 text-emerald-500/50 mb-3" />
              <p className="text-lg font-medium text-white/80">No duplicates found</p>
              <p className="text-sm">Your customer database is clean.</p>
            </div>
          ) : (
            <div className="space-y-8 max-h-[60vh] pr-2">
              {duplicates.map(group => (
                <div key={group.group_id} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium flex items-center gap-2"><Users size={16} className="text-brand-accent"/> Potential Match Group</h3>
                    <Button size="sm" onClick={() => openMergeModal(group)} className="bg-brand-accent text-white hover:opacity-90">Merge Group...</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.customers.map(c => (
                      <div key={c.id} className="bg-black/20 p-4 rounded-lg border border-white/5 text-sm">
                        <div className="font-bold text-white mb-2">{c.full_name} <span className="font-mono text-xs text-brand-accent ml-2">{getDisplayCode(c.id)}</span></div>
                        <div className="text-white/60 grid grid-cols-[80px_1fr] gap-1">
                          <span>Email:</span> <span className="text-white/90 truncate">{c.email}</span>
                          <span>Phone:</span> <span className="text-white/90">{c.country_code} {c.mobile}</span>
                          <span>Created:</span> <span className="text-white/90">{new Date(c.created_at).toLocaleDateString()}</span>
                          <span>Sessions:</span> <span className="text-white/90">{c.session_count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* MERGE MODAL */}
      <Modal isOpen={isMergeModalOpen} onClose={() => setIsMergeModalOpen(false)} title="Merge Customers" className="max-w-3xl">
        {mergeGroup && (
          <div className="space-y-6">
            <p className="text-white/70 text-sm">Select the primary customer account to KEEP. The other accounts will be merged into this one (favorites & sessions transferred), and then deactivated.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mergeGroup.customers.map(c => {
                const isSelected = mergeKeepId === c.id;
                return (
                  <div 
                    key={c.id} 
                    onClick={() => setMergeKeepId(c.id)}
                    className={`cursor-pointer rounded-xl p-5 border-2 transition-all ${isSelected ? 'bg-brand-accent/10 border-brand-accent' : 'bg-white/5 border-transparent hover:border-white/10'}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-bold text-white text-lg">{c.full_name}</div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-brand-accent bg-brand-accent' : 'border-white/30'}`}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-white/70">
                      <div><span className="w-16 inline-block text-white/40">Code:</span> {getDisplayCode(c.id)}</div>
                      <div><span className="w-16 inline-block text-white/40">Email:</span> {c.email}</div>
                      <div><span className="w-16 inline-block text-white/40">Phone:</span> {c.country_code} {c.mobile}</div>
                      <div><span className="w-16 inline-block text-white/40">Company:</span> {c.company || '-'}</div>
                      <div><span className="w-16 inline-block text-white/40">Sessions:</span> {c.session_count}</div>
                      <div><span className="w-16 inline-block text-white/40">Joined:</span> {new Date(c.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setIsMergeModalOpen(false)}>Cancel</Button>
              <Button className="bg-brand-terracotta text-white hover:opacity-90 font-bold uppercase tracking-widest" onClick={handleMerge}>Confirm Merge</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
