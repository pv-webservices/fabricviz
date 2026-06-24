import React from 'react';
import { X } from 'lucide-react';

interface FabricZoomModalProps {
  fabric: any;
  collection: any;
  onClose: () => void;
}

export default function FabricZoomModal({ fabric, collection, onClose }: FabricZoomModalProps) {
  if (!fabric) return null;

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${url}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-4xl bg-brand-dark rounded-xl overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 bg-black/50 hover:bg-black text-white rounded-full transition-colors border border-white/10"
        >
          <X size={20} />
        </button>

        {/* Left Side: Image */}
        <div className="w-full md:w-3/5 bg-black p-4 flex items-center justify-center min-h-[300px]">
          {(fabric.swatch_url || fabric.texture_url) ? (
            <img 
              src={getImageUrl(fabric.swatch_url || fabric.texture_url)} 
              alt={fabric.name} 
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <div className="text-white/20">No Image Available</div>
          )}
        </div>

        {/* Right Side: Details */}
        <div className="w-full md:w-2/5 p-8 overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1 uppercase tracking-wide">{fabric.name}</h2>
            <p className="text-brand-muted font-mono text-sm">{fabric.code}</p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-brand-muted">Code</span>
              <span className="text-white font-mono">{fabric.code}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-brand-muted">Category</span>
              <span className="text-white capitalize">fabric</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-brand-muted">Collection</span>
              <span className="text-white uppercase">{collection?.name || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-brand-muted">Color</span>
              <span className="text-white capitalize">{fabric.color_family || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-brand-muted">Material / Quality</span>
              <span className="text-white capitalize">{fabric.quality || 'Standard'}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-brand-muted">End Use</span>
              <span className="text-white capitalize">{fabric.end_use || '-'}</span>
            </div>
          </div>

          {fabric.tags && fabric.tags.length > 0 && (
            <div className="mt-8">
              <span className="text-brand-muted text-sm block mb-3">Tags</span>
              <div className="flex flex-wrap gap-2">
                {fabric.tags.map((tag: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-transparent border border-white/20 text-white text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
