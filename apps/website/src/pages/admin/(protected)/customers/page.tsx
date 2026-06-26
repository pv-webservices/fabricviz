import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { 
  Users, Search, ChevronDown, ChevronUp, Check, X, ShieldAlert 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchCustomers();
      else setPage(1); // will trigger above useEffect
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<any>(`/api/admin/customers?page=${page}&limit=20&search=${encodeURIComponent(search)}`, { requireAuth: true });
      setCustomers(data.data);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setCustomerDetails(null);
      return;
    }
    setExpandedId(id);
    setDetailsLoading(true);
    try {
      const data = await fetchApi<any>(`/api/admin/customers/${id}`, { requireAuth: true });
      setCustomerDetails(data);
    } catch (err) {
      console.error('Failed to load details', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleActiveStatus = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetchApi(`/api/admin/customers/${id}`, {
        method: 'PATCH',
        requireAuth: true,
        body: JSON.stringify({ is_active: !currentStatus })
      });
      // update local state
      setCustomers(customers.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
      if (customerDetails?.id === id) {
        setCustomerDetails({ ...customerDetails, is_active: !currentStatus });
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">B2C Customers</h1>
        <p className="text-slate-500 mt-1">Manage B2C registered users and their favorites.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              Customer Accounts
              <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">{total}</span>
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                className="pl-9 bg-slate-50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading && customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading customers...</td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No customers found.</td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <React.Fragment key={c.id}>
                      <tr 
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${expandedId === c.id ? 'bg-slate-50/80' : ''}`}
                        onClick={() => loadDetails(c.id)}
                      >
                        <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                          {expandedId === c.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          {c.full_name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{c.email}</td>
                        <td className="px-4 py-3 text-slate-600">{c.country_code} {c.mobile}</td>
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => toggleActiveStatus(c.id, c.is_active, e)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${c.is_active ? 'bg-indigo-600' : 'bg-slate-200'}`}
                          >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${c.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                      {expandedId === c.id && (
                        <tr>
                          <td colSpan={5} className="p-0 border-b-2 border-indigo-100">
                            <div className="bg-slate-50/50 p-6">
                              {detailsLoading ? (
                                <div className="text-center text-slate-500 py-4">Loading details...</div>
                              ) : customerDetails ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div>
                                    <h4 className="font-semibold text-slate-900 mb-4 border-b pb-2">Profile Information</h4>
                                    <div className="space-y-3 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Company</span>
                                        <span className="font-medium text-slate-900">{customerDetails.company || '-'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">City</span>
                                        <span className="font-medium text-slate-900">{customerDetails.city || '-'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Account Status</span>
                                        <span>
                                          {customerDetails.is_active ? 
                                            <span className="text-emerald-600 font-medium flex items-center gap-1"><Check size={14}/> Active</span> : 
                                            <span className="text-rose-600 font-medium flex items-center gap-1"><X size={14}/> Suspended</span>
                                          }
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {!customerDetails.is_active && (
                                      <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-sm rounded flex items-start gap-2 border border-amber-200/50">
                                        <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                                        <p>This user's account is currently suspended. They cannot log in or use the API until reactivated.</p>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-slate-900 mb-4 border-b pb-2">
                                      Favorited Fabrics ({customerDetails.favorites?.length || 0})
                                    </h4>
                                    {customerDetails.favorites?.length === 0 ? (
                                      <p className="text-slate-500 italic">No favorites yet.</p>
                                    ) : (
                                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-2">
                                        {customerDetails.favorites?.map((fav: any) => (
                                          <div key={fav.id} className="relative aspect-square rounded-md overflow-hidden bg-slate-100 group border" title={fav.name}>
                                            <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${fav.image_url}`} alt={fav.name} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                                              <span className="text-[9px] text-white font-medium text-center leading-tight truncate w-full px-1">{fav.code}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center text-rose-500 py-4">Failed to load details</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {total > 20 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-slate-500">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page * 20 >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
