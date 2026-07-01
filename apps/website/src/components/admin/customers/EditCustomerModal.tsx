import React, { useState, FormEvent, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TagInput } from '@/components/admin/TagInput';
import { fetchApi } from '@/lib/api';
import { CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Customer } from '@/types/customer';

const COUNTRY_CODES = [
  { code: '+91', name: 'India' },
  { code: '+1', name: 'USA/Canada' },
  { code: '+44', name: 'UK' },
  { code: '+61', name: 'Australia' },
  { code: '+971', name: 'UAE' },
  { code: '+65', name: 'Singapore' },
  { code: '+60', name: 'Malaysia' },
  { code: '+81', name: 'Japan' },
  { code: '+49', name: 'Germany' },
  { code: '+33', name: 'France' },
  { code: '+39', name: 'Italy' },
  { code: '+34', name: 'Spain' },
  { code: '+55', name: 'Brazil' }
];

interface EditCustomerModalProps {
  customer: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCustomerModal({ customer, onClose, onSuccess }: EditCustomerModalProps) {
  const [formData, setFormData] = useState({
    access_code: '',
    full_name: '',
    company: '',
    city: '',
    email: '',
    country_code: '+91',
    mobile: '',
    notes: '',
    tags: [] as string[],
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeStatus, setCodeStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setFormData({
        access_code: customer.access_code || '',
        full_name: customer.full_name,
        company: customer.company || '',
        city: customer.city || '',
        email: customer.email,
        country_code: customer.country_code || '+91',
        mobile: customer.mobile || '',
        notes: customer.notes || '',
        tags: customer.tags || [],
        is_active: customer.is_active
      });
      setErrors({});
      setCodeStatus('valid');
    }
  }, [customer]);

  const handleGenerateCode = async () => {
    try {
      setCodeStatus('checking');
      const res = await fetchApi<any>('/api/admin/customers/generate-code');
      setFormData(prev => ({ ...prev, access_code: res.code }));
      setCodeStatus('valid');
      setErrors(prev => ({ ...prev, access_code: '' }));
    } catch (err: any) {
      toast.error('Failed to generate code');
      setCodeStatus('invalid');
    }
  };

  const handleCodeBlur = async () => {
    if (!formData.access_code || formData.access_code.length !== 5) {
      setCodeStatus('invalid');
      setErrors(prev => ({ ...prev, access_code: 'Must be exactly 5 digits' }));
      return;
    }
    
    if (!/^[0-9]{5}$/.test(formData.access_code)) {
      setCodeStatus('invalid');
      setErrors(prev => ({ ...prev, access_code: 'Must be exactly 5 digits' }));
      return;
    }

    setCodeStatus('valid');
    setErrors(prev => ({ ...prev, access_code: '' }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setErrors({});
    setIsSubmitting(true);

    try {
      await fetchApi(`/api/admin/customers/${customer.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData)
      });
      
      toast.success('Customer updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Failed to update customer';
      if (msg.toLowerCase().includes('email')) {
        setErrors({ email: msg });
      } else if (msg.toLowerCase().includes('access code')) {
        setErrors({ access_code: msg });
        setCodeStatus('invalid');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={!!customer} onClose={onClose} title="Edit Customer">
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        
        {/* Access Code */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/80">Access Code</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input 
                required 
                maxLength={5}
                pattern="[0-9]{5}"
                placeholder="e.g. 24593" 
                value={formData.access_code} 
                onChange={e => setFormData({ ...formData, access_code: e.target.value.replace(/[^0-9]/g, '').slice(0,5) })} 
                onBlur={handleCodeBlur}
                className="pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {codeStatus === 'valid' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {codeStatus === 'invalid' && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            </div>
            <Button type="button" variant="outline" onClick={handleGenerateCode}>Generate</Button>
          </div>
          {errors.access_code && <p className="text-xs text-red-500">{errors.access_code}</p>}
        </div>

        {/* Customer Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/80">Customer Name</label>
          <Input 
            required 
            minLength={2}
            value={formData.full_name} 
            onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
          />
        </div>

        {/* Company & City */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/80">Company</label>
            <Input 
              value={formData.company} 
              onChange={e => setFormData({ ...formData, company: e.target.value })} 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/80">City</label>
            <Input 
              value={formData.city} 
              onChange={e => setFormData({ ...formData, city: e.target.value })} 
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/80">Email</label>
          <Input 
            type="email"
            required 
            value={formData.email} 
            onChange={e => setFormData({ ...formData, email: e.target.value })} 
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        {/* Customer Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/80">Customer Phone</label>
          <div className="flex gap-2">
            <select 
              className="bg-brand-dark border border-white/20 rounded-md text-white px-3 py-2 text-sm focus:outline-none focus:border-brand-accent w-28"
              value={formData.country_code}
              onChange={e => setFormData({ ...formData, country_code: e.target.value })}
            >
              {COUNTRY_CODES.map(c => (
                <option key={c.code} value={c.code}>{c.code} {c.name}</option>
              ))}
            </select>
            <Input 
              className="flex-1"
              value={formData.mobile} 
              onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/[^0-9]/g, '') })} 
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/80">Notes</label>
          <textarea 
            rows={3}
            placeholder="Any internal notes about this customer..."
            className="w-full bg-transparent border border-white/20 rounded-md text-white px-3 py-2 text-sm focus:outline-none focus:border-brand-accent resize-none placeholder:text-white/30"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/80">Tags</label>
          <TagInput 
            value={formData.tags}
            onChange={tags => setFormData({ ...formData, tags })}
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between pt-2">
          <label className="text-sm font-medium text-white/80">Active</label>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${formData.is_active ? 'bg-brand-accent' : 'bg-white/10'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 mt-4 border-t border-white/10">
          <Button type="button" variant="ghost" onClick={onClose} className="text-white/60 hover:text-white">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-brand-accent text-white hover:bg-brand-accent/90">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
