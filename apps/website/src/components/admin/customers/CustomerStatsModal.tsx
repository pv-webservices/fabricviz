import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { fetchApi } from '@/lib/api';
import { CustomerStats, Customer } from '@/types/customer';
import { Sparkles, Activity, Target, Upload, Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface CustomerStatsModalProps {
  customer: Customer | null;
  onClose: () => void;
  onAddCredits: (customer: Customer) => void;
}

export function CustomerStatsModal({ customer, onClose, onAddCredits }: CustomerStatsModalProps) {
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    if (!customer) return;
    try {
      setLoading(true);
      const res = await fetchApi(`/api/admin/customers/${customer.id}/stats`);
      setStats(res);
    } catch (err: any) {
      toast.error('Failed to load customer stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer) {
      loadStats();
    } else {
      setStats(null);
    }
  }, [customer]);

  if (!customer) return null;

  return (
    <Modal isOpen={!!customer} onClose={onClose} title={`${customer.access_code} — ${customer.full_name}`}>
      {loading || !stats ? (
        <div className="py-20 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-6 pt-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          
          {/* SECTION 1 - AI Generation Credits */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-accent" />
                AI Generation Credits
              </h3>
              <button 
                onClick={() => onAddCredits(customer)}
                className="bg-brand-accent/90 text-white text-sm px-3 py-1.5 rounded-md hover:bg-brand-accent transition-colors"
              >
                + Add Credits
              </button>
            </div>
            
            <div className="space-y-1">
              <span className="text-white/50 text-xs">Remaining</span>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-accent to-yellow-400 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, (stats.credits.remaining_credits / stats.credits.total_credits) * 100))}%` }}
                  />
                </div>
                <span className="text-white font-bold text-sm">
                  {stats.credits.remaining_credits} / {stats.credits.total_credits}
                </span>
              </div>
              <div className="flex justify-between items-center text-white/40 text-xs">
                <span>Used: {stats.credits.used_credits}</span>
                <span>Total: {stats.credits.total_credits}</span>
              </div>
            </div>
          </div>

          {/* SECTION 2 - Visualization History */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              🖼 Visualization History
              <span className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full">
                {stats.visualization_history.length}
              </span>
            </h3>
            
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {stats.visualization_history.length === 0 ? (
                <p className="text-white/40 text-sm text-center w-full py-4 italic">No visualizations yet</p>
              ) : (
                stats.visualization_history.map(viz => (
                  <div key={viz.id} className="min-w-[140px] flex-shrink-0 flex flex-col gap-2">
                    <div className="w-full aspect-[3/4] bg-white/5 rounded-md overflow-hidden bg-cover bg-center" style={{ backgroundImage: viz.thumbnail_url ? `url(${viz.thumbnail_url})` : 'none' }}>
                      {!viz.thumbnail_url && <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">No Image</div>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-white text-xs font-medium truncate">{viz.fabric_name}</span>
                      <div className="flex items-center justify-between">
                        <span className="bg-white/10 text-white/50 text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">{viz.fabric_category}</span>
                        <span className="text-white/40 text-xs">{format(new Date(viz.created_at), 'MMM d')}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 3 - Credit History */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              🕐 Credit History
            </h3>
            <div className="space-y-2">
              {stats.credit_history.length === 0 ? (
                <p className="text-white/40 text-sm italic">No credit history yet</p>
              ) : (
                stats.credit_history.map(h => (
                  <div key={h.id} className="flex items-center justify-between bg-white/5 p-2 rounded-md">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${h.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {h.amount > 0 ? '+' : ''}{h.amount}
                      </span>
                      <span className="bg-white/10 text-white/60 text-xs rounded-full px-2 py-0.5">
                        {h.note || 'Manual Grant'}
                      </span>
                    </div>
                    <span className="text-white/40 text-xs">
                      {format(new Date(h.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 4 - Activity Summary */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Activity Summary</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-lg p-3 text-center flex flex-col items-center gap-1">
                <Activity className="w-5 h-5 text-brand-accent/70 mb-1" />
                <span className="text-white/50 text-xs leading-tight">Area Selected</span>
                <span className="text-white font-bold text-xl">{stats.activity_summary.areas_selected}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center flex flex-col items-center gap-1">
                <Target className="w-5 h-5 text-brand-accent/70 mb-1" />
                <span className="text-white/50 text-xs leading-tight">Fabric Selected</span>
                <span className="text-white font-bold text-xl">{stats.activity_summary.fabrics_selected}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center flex flex-col items-center gap-1">
                <Activity className="w-5 h-5 text-brand-accent/70 mb-1" />
                <span className="text-white/50 text-xs leading-tight">Visualization Generated</span>
                <span className="text-white font-bold text-xl">{stats.activity_summary.visualizations_generated}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center flex flex-col items-center gap-1">
                <Upload className="w-5 h-5 text-brand-accent/70 mb-1" />
                <span className="text-white/50 text-xs leading-tight">Image Uploaded</span>
                <span className="text-white font-bold text-xl">{stats.activity_summary.images_uploaded}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center flex flex-col items-center gap-1">
                <Download className="w-5 h-5 text-brand-accent/70 mb-1" />
                <span className="text-white/50 text-xs leading-tight">Downloaded</span>
                <span className="text-white font-bold text-xl">{stats.activity_summary.images_downloaded}</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </Modal>
  );
}
