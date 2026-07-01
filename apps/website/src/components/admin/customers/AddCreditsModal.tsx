import React, { useState, FormEvent } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import { Customer } from '@/types/customer';
import { Sparkles, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AddCreditsModalProps {
  customer: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCreditsModal({ customer, onClose, onSuccess }: AddCreditsModalProps) {
  const [amount, setAmount] = useState<number>(30);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const AMOUNTS = [10, 20, 30, 50, 100];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setIsSubmitting(true);
    try {
      await fetchApi(`/api/admin/customers/${customer.id}/credits`, {
        method: 'POST',
        body: JSON.stringify({ amount, note })
      });
      toast.success(`✓ ${amount} credits added to ${customer.full_name}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add credits');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!customer) return null;

  return (
    <Modal isOpen={!!customer} onClose={onClose} title="✨ Add Credits">
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        
        {/* Context Box */}
        <div className="bg-white/5 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{customer.access_code}</span>
            <span className="text-white/70">— {customer.full_name}</span>
          </div>
          <div className="text-white/50 text-xs mt-1">
            Current total: {customer.credits?.total_credits || 0} credits
          </div>
        </div>

        {/* Credits to Add */}
        <div className="space-y-1.5 relative">
          <label className="text-sm font-medium text-white/80">Credits to Add</label>
          <div 
            className="w-full bg-brand-dark border border-white/20 rounded-md text-white px-3 py-2 text-sm flex items-center justify-between cursor-pointer focus:border-brand-accent"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            tabIndex={0}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
          >
            <span>{amount} Credits</span>
            <ChevronDown className="w-4 h-4 text-white/50" />
          </div>
          
          {dropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-brand-dark border border-white/20 rounded-md shadow-lg overflow-hidden">
              {AMOUNTS.map(opt => (
                <div 
                  key={opt}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-white/10 ${amount === opt ? 'bg-brand-accent/20 text-brand-accent' : 'text-white'}`}
                  onClick={() => {
                    setAmount(opt);
                    setDropdownOpen(false);
                  }}
                >
                  {opt} Credits
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/80">Notes (optional)</label>
          <textarea 
            rows={3}
            placeholder="Reason for adding credits..."
            className="w-full bg-brand-dark border border-white/15 rounded-md text-white px-3 py-2 text-sm focus:outline-none focus:border-brand-accent resize-none placeholder:text-white/30"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 mt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="text-white/60 hover:text-white">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-brand-accent text-white flex items-center gap-2 px-4 hover:bg-brand-accent/90">
            {isSubmitting ? 'Adding...' : (
              <>
                <Sparkles className="w-4 h-4" />
                Add {amount} Credits
              </>
            )}
          </Button>
        </div>

      </form>
    </Modal>
  );
}
