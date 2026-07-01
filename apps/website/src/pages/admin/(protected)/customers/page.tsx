import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { 
  Users, Search, ChevronDown, Check, X, 
  LayoutGrid, LayoutList, Tag, Download, UsersRound 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { exportCustomersToCSV } from '@/utils/exportCsv';
import { Customer, DuplicateGroup } from '@/types/customer';

import { CustomerCard } from '@/components/admin/customers/CustomerCard';
import { AddCustomerModal } from '@/components/admin/customers/AddCustomerModal';
import { EditCustomerModal } from '@/components/admin/customers/EditCustomerModal';
import { CustomerStatsModal } from '@/components/admin/customers/CustomerStatsModal';
import { AddCreditsModal } from '@/components/admin/customers/AddCreditsModal';
import { Modal } from '@/components/ui/modal';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

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
  
  // Tags filter
  const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
  const [tagFilterInput, setTagFilterInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // --- State: Dropdowns ---
  const [openDropdown, setOpenDropdown] = useState<'session' | 'status' | null>(null);

  // --- State: Modals ---
  const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [statsCustomer, setStatsCustomer] = useState<Customer | null>(null);
  const [creditsCustomer, setCreditsCustomer] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDuplicatesModalOpen, setIsDuplicatesModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  // Modal Context Data
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [mergeGroup, setMergeGroup] = useState<DuplicateGroup | null>(null);
  const [mergeKeepId, setMergeKeepId] = useState<string>('');

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
      setCustomers(data.data);
      setTotal(data.total);
      
      const allTags = new Set<string>();
      data.data.forEach((c: Customer) => c.tags?.forEach(t => allTags.add(t)));
      setAvailableTags(Array.from(allTags));
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Duplicate Logic ---
  const checkDuplicates = async () => {
    try {
      const data = await fetchApi<any>('/api/admin/customers/duplicate-check', { requireAuth: true });
      setDuplicates(data);
      setIsDuplicatesModalOpen(true);
    } catch (err) {
      toast.error('Failed to check duplicates');
    }
  };

  const startMerge = (group: DuplicateGroup) => {
    setMergeGroup(group);
    setMergeKeepId(group.customers[0].id);
    setIsDuplicatesModalOpen(false);
    setIsMergeModalOpen(true);
  };

  const handleMerge = async () => {
    if (!mergeGroup || !mergeKeepId) return;
    const merge_ids = mergeGroup.customers.filter(c => c.id !== mergeKeepId).map(c => c.id);
    try {
      await fetchApi('/api/admin/customers/merge', {
        method: 'POST',
        requireAuth: true,
        body: JSON.stringify({ keep_id: mergeKeepId, merge_ids })
      });
      toast.success('Customers merged successfully');
      setIsMergeModalOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to merge customers');
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      await fetchApi(`/api/admin/customers/${customerToDelete.id}`, {
        method: 'DELETE',
        requireAuth: true
      });
      toast.success('Customer deleted (deactivated)');
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to delete customer');
    }
  };

  const handleExport = () => {
    exportCustomersToCSV(customers);
  };

  return (
    <div className="flex-1 overflow-auto bg-brand-bg text-white">
      
      {/* Header & Tools */}
      <div className="p-8 pb-4">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif text-white tracking-wide">Customers</h1>
              <p className="text-white/60 mt-1 flex items-center gap-2">
                Manage B2C customers, credits, and visualize behavior.
                <span className="bg-white/10 px-2 py-0.5 rounded text-xs">{total} Total</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10" onClick={checkDuplicates}>
                <UsersRound className="w-4 h-4 mr-2" />
                Find Duplicates
              </Button>
              <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button className="bg-brand-accent text-white hover:bg-brand-accent/90" onClick={() => setAddCustomerModalOpen(true)}>
                + Add Customer
              </Button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-3 bg-brand-dark p-3 rounded-lg border border-white/5 flex-wrap">
            <div className="relative max-w-sm flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <Input
                placeholder="Search customers, access codes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-transparent border-white/10 w-full"
              />
            </div>

            {/* View Toggles */}
            <div className="flex bg-black/40 rounded-md p-1 border border-white/5">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                <LayoutList className="w-4 h-4" />
              </button>
            </div>

            {/* Session Filter */}
            <div className="relative">
              <button onClick={() => setOpenDropdown(openDropdown === 'session' ? null : 'session')} className="px-3 py-2 bg-transparent border border-white/10 rounded-md text-sm text-white/80 hover:bg-white/5 flex items-center gap-2">
                Sessions: {sessionFilter === 'all' ? 'All' : sessionFilter === 'zero' ? 'Zero' : sessionFilter === 'has' ? 'Has Sessions' : sessionFilter === 'highest' ? 'Highest' : 'Latest'}
                <ChevronDown className="w-4 h-4" />
              </button>
              {openDropdown === 'session' && (
                <div className="absolute top-full mt-1 w-48 bg-[#2A2A2A] border border-white/10 rounded-md shadow-xl py-1 z-20">
                  {['all', 'zero', 'has', 'highest', 'latest'].map(val => (
                    <button key={val} className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/10" onClick={() => { setSessionFilter(val as any); setOpenDropdown(null); }}>
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative">
              <button onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')} className="px-3 py-2 bg-transparent border border-white/10 rounded-md text-sm text-white/80 hover:bg-white/5 flex items-center gap-2">
                Status: {statusFilter === 'all' ? 'All' : statusFilter === 'active' ? 'Active' : 'Inactive'}
                <ChevronDown className="w-4 h-4" />
              </button>
              {openDropdown === 'status' && (
                <div className="absolute top-full mt-1 w-32 bg-[#2A2A2A] border border-white/10 rounded-md shadow-xl py-1 z-20">
                  {['all', 'active', 'inactive'].map(val => (
                    <button key={val} className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/10" onClick={() => { setStatusFilter(val as any); setOpenDropdown(null); }}>
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tags Filter */}
            <div className="relative">
              <button onClick={() => setIsTagFilterOpen(!isTagFilterOpen)} className={`px-3 py-2 border rounded-md text-sm flex items-center gap-2 transition-colors ${selectedTags.length > 0 ? 'bg-brand-accent/20 border-brand-accent/50 text-brand-accent' : 'bg-transparent border-white/10 text-white/80 hover:bg-white/5'}`}>
                <Tag className="w-4 h-4" />
                Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                <ChevronDown className="w-4 h-4" />
              </button>
              {isTagFilterOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-[#2A2A2A] border border-white/10 rounded-md shadow-xl p-3 z-20">
                  <Input placeholder="Filter by tag..." value={tagFilterInput} onChange={e => setTagFilterInput(e.target.value)} className="mb-2 h-8 text-sm" />
                  <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                    {availableTags.filter(t => t.toLowerCase().includes(tagFilterInput.toLowerCase())).map(t => (
                      <label key={t} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded cursor-pointer">
                        <input type="checkbox" checked={selectedTags.includes(t)} onChange={(e) => {
                          if (e.target.checked) setSelectedTags([...selectedTags, t]);
                          else setSelectedTags(selectedTags.filter(tag => tag !== t));
                        }} className="accent-brand-accent" />
                        <span className="text-sm text-white/80">{t}</span>
                      </label>
                    ))}
                    {availableTags.length === 0 && <p className="text-xs text-white/40 text-center py-2">No tags available</p>}
                  </div>
                </div>
              )}
            </div>

            {selectedTags.length > 0 && (
              <button onClick={() => setSelectedTags([])} className="text-xs text-white/40 hover:text-white underline">
                Clear Tags
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-8 pb-8">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center border border-white/5 bg-brand-dark rounded-xl flex flex-col items-center justify-center gap-3">
            <Users className="w-12 h-12 text-white/20" />
            <p className="text-white/40">No customers found.</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {customers.map(c => (
                  <CustomerCard 
                    key={c.id} 
                    customer={c} 
                    onEdit={setEditingCustomer}
                    onStats={setStatsCustomer}
                    onDelete={(c) => { setCustomerToDelete(c); setIsDeleteModalOpen(true); }}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-brand-dark border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-white/70">
                  <thead className="bg-black/40 text-white/50 text-xs uppercase border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3 font-medium">Access Code</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Contact</th>
                      <th className="px-4 py-3 font-medium">Credits</th>
                      <th className="px-4 py-3 font-medium">Sessions</th>
                      <th className="px-4 py-3 font-medium">Last Active</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {customers.map(c => (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-serif font-bold text-white">{c.access_code}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-white/90">{c.full_name}</span>
                            <span className="text-xs text-white/40">{c.company || c.city || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col text-xs">
                            <span>{c.email}</span>
                            <span>{c.country_code} {c.mobile}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-white">{c.credits?.remaining_credits || 0}</span>
                            <span className="text-white/40 text-xs">/ {c.credits?.total_credits || 30}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-brand-accent">{c.session_count || 0}</td>
                        <td className="px-4 py-3 text-xs">
                          {c.last_active_at ? format(new Date(c.last_active_at), 'MMM d, yyyy') : <span className="italic text-white/30">Never</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setStatsCustomer(c)} className="h-8 text-xs text-brand-accent">Stats</Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingCustomer(c)} className="h-8 text-xs ml-1">Edit</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-white/40">Showing {customers.length} of {total}</span>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="border-white/10">Prev</Button>
                <Button variant="outline" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="border-white/10">Next</Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- MODALS --- */}
      
      <AddCustomerModal 
        isOpen={addCustomerModalOpen} 
        onClose={() => setAddCustomerModalOpen(false)}
        onSuccess={fetchCustomers}
      />
      
      <EditCustomerModal 
        customer={editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onSuccess={fetchCustomers}
      />

      <CustomerStatsModal 
        customer={statsCustomer}
        onClose={() => setStatsCustomer(null)}
        onAddCredits={(c) => setCreditsCustomer(c)}
      />

      <AddCreditsModal 
        customer={creditsCustomer}
        onClose={() => setCreditsCustomer(null)}
        onSuccess={() => {
          fetchCustomers();
          if (statsCustomer) {
             // Force re-render of stats modal by toggling it briefly or just wait for it to fetch again. 
             // In our CustomerStatsModal, it watches `customer` prop. To refresh, we can just close and open or manage a refresh counter.
             // Given time, simply refetching list updates the list. 
             setStatsCustomer({ ...statsCustomer }); // triggers effect to reload stats
          }
        }}
      />

      {/* Duplicates Modal */}
      <Modal isOpen={isDuplicatesModalOpen} onClose={() => setIsDuplicatesModalOpen(false)} title="Duplicate Groups Detected">
        <div className="pt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {duplicates.length === 0 ? (
            <p className="text-center text-white/50 py-8">No duplicates detected based on email, mobile, or fuzzy name match.</p>
          ) : (
            <div className="space-y-6">
              {duplicates.map((group, i) => (
                <div key={group.group_id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-brand-accent">Group {i + 1} ({group.customers.length} Accounts)</h3>
                    <Button size="sm" onClick={() => startMerge(group)} className="bg-white/10 hover:bg-white/20 h-7 text-xs">
                      Merge Group
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {group.customers.map(c => (
                      <div key={c.id} className="flex flex-col text-sm bg-black/40 p-2 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium text-white">{c.full_name}</span>
                          <span className="text-white/40">{c.session_count} Sessions</span>
                        </div>
                        <div className="text-white/50 text-xs">
                          {c.email} • {c.mobile || 'No mobile'}
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

      {/* Merge Modal */}
      <Modal isOpen={isMergeModalOpen} onClose={() => setIsMergeModalOpen(false)} title="Merge Customers">
        <div className="pt-4 space-y-4">
          <p className="text-sm text-white/70">
            Select the <strong className="text-white">Master Account</strong>. The other accounts in this group will be soft-deleted. Their sessions, last active dates, and favorites will be merged into the Master Account.
          </p>
          <div className="space-y-2">
            {mergeGroup?.customers.map(c => (
              <label key={c.id} className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${mergeKeepId === c.id ? 'bg-brand-accent/10 border-brand-accent' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                <input 
                  type="radio" 
                  name="mergeKeepId" 
                  checked={mergeKeepId === c.id} 
                  onChange={() => setMergeKeepId(c.id)}
                  className="mt-1 accent-brand-accent"
                />
                <div className="flex-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-white">{c.full_name}</span>
                    <span className="text-brand-accent">{c.session_count} Sessions</span>
                  </div>
                  <div className="text-white/50 text-xs mt-1">
                    {c.email} <br/> {c.mobile} <br/>
                    Created: {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsMergeModalOpen(false)}>Cancel</Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleMerge}>
              Confirm Merge
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Deactivate Customer">
        <div className="pt-4 space-y-4">
          <p className="text-white/70">
            Are you sure you want to deactivate <strong className="text-white">{customerToDelete?.full_name}</strong>? 
            This will soft-delete their account and prevent them from logging in.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleDelete}>
              Deactivate
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
