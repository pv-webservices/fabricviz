import React, { useState } from 'react';
import { Customer } from '@/types/customer';
import { Pencil, Copy, Trash2, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onStats: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export function CustomerCard({ customer, onEdit, onStats, onDelete }: CustomerCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(customer.access_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const brandName = "Decomax Lifestyle";
    const message = `${brandName}

Hi ${customer.full_name}! 👋

📋 Name: ${customer.full_name}
🏢 Company: ${customer.company || 'N/A'}
🏙️ City: ${customer.city || 'N/A'}
📱 Mobile: ${customer.mobile}

Here is your access code for the MOOD WRAP app:
🔑 *${customer.access_code}*

Click the link below to start visualizing fabrics in your space:
https://moodwrap.in

Simply enter the code when prompted and explore our fabric collection!`;

    const cleanCountryCode = (customer.country_code || '+91').replace('+', '');
    const cleanMobile = (customer.mobile || '').replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanCountryCode}${cleanMobile}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="bg-brand-dark border border-white/5 p-4 rounded-xl flex flex-col gap-3 relative group">
      
      {/* Top Row: Access Code & Actions */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="text-lg font-serif text-white font-semibold">{customer.access_code}</span>
          
          {/* Copy Icon */}
          <div className="relative group/copy">
            <button onClick={handleCopy} className="p-1 hover:bg-white/10 rounded-md transition-colors" title="Copy Code">
              <Copy className="w-4 h-4 text-white/50 group-hover/copy:text-white" />
            </button>
            {copied && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                Copied!
              </span>
            )}
          </div>
          
          {/* WhatsApp Share Icon */}
          <button onClick={handleWhatsApp} className="p-1 hover:bg-white/10 rounded-md transition-colors" title="Share via WhatsApp">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-400">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(customer)} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md text-white/50 hover:text-white" title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(customer)} className="p-1.5 bg-white/5 hover:bg-red-500/20 rounded-md text-white/50 hover:text-red-400" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="flex flex-col">
        <h3 className="font-semibold text-white/90 text-lg">{customer.full_name}</h3>
        <p className="text-white/50 text-sm flex items-center gap-2">
          {customer.email}
          {!customer.is_active && (
            <span className="flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 font-medium">
              <ShieldAlert className="w-3 h-3" />
              Inactive
            </span>
          )}
        </p>
        <p className="text-white/50 text-sm">
          {customer.country_code} {customer.mobile}
        </p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        {customer.company && <span className="bg-white/5 text-white/70 text-xs px-2 py-1 rounded">{customer.company}</span>}
        {customer.city && <span className="bg-white/5 text-white/70 text-xs px-2 py-1 rounded">{customer.city}</span>}
      </div>

      {/* Tags */}
      {customer.tags && customer.tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {customer.tags.map(tag => (
            <span key={tag} className="text-[10px] bg-brand-accent/20 text-brand-accent px-1.5 py-0.5 rounded border border-brand-accent/30">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Sessions and Last Activity */}
      <div className="flex flex-col gap-1 mt-auto pt-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-white/40">Joined: {format(new Date(customer.created_at), 'MMM d, yyyy')}</span>
          <span className="text-brand-accent">{customer.session_count || 0} Sessions</span>
        </div>
        
        {customer.last_active_at ? (
          <span className="text-brand-accent/80 text-xs">
            Last active: {format(new Date(customer.last_active_at), "MMM d, yyyy 'at' h:mm a")}
          </span>
        ) : (
          <span className="text-white/30 text-xs italic">Never active</span>
        )}

        {/* Credits Mini-Bar */}
        <div className="mt-2 flex flex-col gap-1">
          <span className="text-white/40 text-xs">Credits</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-accent rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, ((customer.credits?.remaining_credits || 0) / (customer.credits?.total_credits || 30)) * 100))}%` }}
              />
            </div>
            <span className="text-white/50 text-xs">{customer.credits?.remaining_credits || 0}/{customer.credits?.total_credits || 30}</span>
          </div>
        </div>
      </div>

      {/* Full width Stats Button */}
      <button 
        onClick={() => onStats(customer)}
        className="w-full mt-2 bg-white/5 hover:bg-white/10 text-white/70 text-xs py-2 rounded-md transition-colors font-medium border border-white/5"
      >
        View Stats
      </button>

    </div>
  );
}
