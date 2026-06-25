import React from 'react';
import { X, Trash2, ArrowRight } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { Link } from 'react-router-dom';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FavoritesDrawer({ isOpen, onClose }: FavoritesDrawerProps) {
  const { favoriteFabrics, toggleFavorite } = useCustomerAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-brand-bg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b border-brand-dark/10">
          <h2 className="font-serif text-2xl font-medium text-brand-dark">My Favorites</h2>
          <button 
            onClick={onClose}
            className="text-brand-dark/50 hover:text-brand-dark transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {favoriteFabrics.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-brand-dark/50">
              <div className="w-16 h-16 rounded-full bg-brand-dark/5 flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 opacity-50" />
              </div>
              <p>You haven't saved any fabrics yet.</p>
              <button 
                onClick={onClose}
                className="mt-6 text-brand-accent font-medium hover:text-brand-dark transition-colors"
              >
                Browse Collection
              </button>
            </div>
          ) : (
            favoriteFabrics.map((fabric) => (
              <div key={fabric.id} className="flex gap-4 p-4 bg-white rounded-lg shadow-sm border border-brand-dark/5 group">
                <Link to={`/catalog/${fabric.id}`} onClick={onClose} className="w-24 h-24 shrink-0 overflow-hidden rounded bg-gray-100">
                  <img 
                    src={fabric.image_url} 
                    alt={fabric.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
                <div className="flex-1 min-w-0 py-1">
                  <p className="text-xs font-semibold tracking-wider text-brand-dark/50 uppercase mb-1">
                    {fabric.collection_name}
                  </p>
                  <Link to={`/catalog/${fabric.id}`} onClick={onClose} className="block font-serif text-lg text-brand-dark truncate hover:text-brand-accent transition-colors">
                    {fabric.title}
                  </Link>
                  <p className="text-sm text-brand-dark/60 mt-1">{fabric.code}</p>
                </div>
                <button
                  onClick={() => toggleFavorite(fabric.id)}
                  className="p-2 text-brand-dark/30 hover:text-brand-terracotta hover:bg-brand-terracotta/5 rounded-full transition-colors self-start"
                  title="Remove from favorites"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {favoriteFabrics.length > 0 && (
          <div className="p-6 border-t border-brand-dark/10 bg-white">
            <a 
              href="https://fabricviz.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full bg-brand-dark text-white py-4 rounded font-medium tracking-wide hover:bg-brand-dark/90 transition-colors"
            >
              TRY ON 3D MODEL
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
