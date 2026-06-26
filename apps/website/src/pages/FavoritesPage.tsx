import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft, Trash2, Search, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import AuthModal from '@/components/AuthModal';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { isAuthenticated, favorites, favoriteFabrics, toggleFavorite } = useCustomerAuth();
  const [authModalOpen, setAuthModalOpen] = useState(!isAuthenticated);
  const [browseModalOpen, setBrowseModalOpen] = useState(false);

  // If the user is unauthenticated and closes the modal, they see an empty state
  // But ideally, the modal forces them to login.

  const handleBrowseMore = () => setBrowseModalOpen(true);
  
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text pt-24 pb-32">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-12">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-brand-muted hover:text-white">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="font-serif text-3xl md:text-5xl font-bold">My Favorites</h1>
            <p className="text-brand-muted mt-2">Saved fabrics for your visualization projects</p>
          </div>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-white/5 rounded-2xl bg-white/5 backdrop-blur-sm">
            <Heart size={48} className="text-brand-muted mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Sign in to save favorites</h2>
            <p className="text-brand-muted max-w-md mb-6">Create an account or sign in to save fabrics and visualize them in your space.</p>
            <Button onClick={() => setAuthModalOpen(true)} className="bg-brand-terracotta hover:bg-[#c95841] text-white">
              Sign In
            </Button>
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-white/5 rounded-2xl bg-white/5 backdrop-blur-sm">
            <Heart size={48} className="text-brand-muted mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Your favorites list is empty</h2>
            <p className="text-brand-muted max-w-md mb-6">Explore our catalog and heart the fabrics you love to save them here.</p>
            <Button onClick={handleBrowseMore} className="bg-white text-black hover:bg-slate-200">
              <Search className="mr-2 h-4 w-4" /> Browse Catalog
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {favoriteFabrics.map((fav: any) => (
              <div key={fav.id} className="group relative bg-[#1e1e1e] rounded-xl overflow-hidden border border-white/5 hover:border-brand-terracotta/50 transition-colors">
                <div className="aspect-square relative overflow-hidden bg-slate-800">
                  <img src={fav.image_url} alt={fav.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <button 
                    onClick={(e) => { e.preventDefault(); toggleFavorite(fav.id); }}
                    className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-red-600/90 text-white rounded-full backdrop-blur-md transition-colors shadow-lg"
                    title="Remove from favorites"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-bold tracking-widest text-brand-terracotta uppercase mb-1">
                    {fav.collection_name || 'COLLECTION'}
                  </div>
                  <h3 className="font-bold text-lg mb-1 truncate text-white">{fav.title}</h3>
                  <p className="text-xs text-brand-muted uppercase tracking-wider">{fav.code}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      {isAuthenticated && favorites.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-brand-dark/95 backdrop-blur-xl border-t border-white/10 p-4 transform transition-transform duration-300 translate-y-0">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-brand-muted font-medium">
              <span className="text-white font-bold">{favorites.length}</span> items in favorites
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button onClick={handleBrowseMore} variant="outline" className="flex-1 sm:flex-none border-white/20 text-white hover:bg-white/10">
                Browse More
              </Button>
              <Button onClick={() => navigate('/visualizer')} className="flex-1 sm:flex-none bg-brand-terracotta hover:bg-[#c95841] text-white border-0 shadow-[0_0_20px_rgba(224,103,79,0.3)] hover:shadow-[0_0_25px_rgba(224,103,79,0.5)] transition-shadow">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Open in Visualizer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Browse More Modal */}
      <Modal isOpen={browseModalOpen} onClose={() => setBrowseModalOpen(false)} title="Browse Catalog" className="max-w-2xl bg-[#1e1e1e] border border-white/10 text-white">
        <div className="grid grid-cols-2 gap-4 mt-4">
          {[
            { title: 'Sofa Fabrics', endUse: 'sofa', icon: <ArrowRight className="h-5 w-5" /> },
            { title: 'Curtain Fabrics', endUse: 'curtain', icon: <ArrowRight className="h-5 w-5" /> },
            { title: 'Rugs', endUse: 'rug', icon: <ArrowRight className="h-5 w-5" /> },
            { title: 'Wallpaper', endUse: 'wallpaper', icon: <ArrowRight className="h-5 w-5" /> }
          ].map((cat) => (
            <div 
              key={cat.endUse}
              onClick={() => { setBrowseModalOpen(false); navigate(cat.endUse === 'sofa' || cat.endUse === 'curtain' ? `/${cat.endUse}` : `/category/${cat.endUse}`); }}
              className="group p-6 bg-white/5 hover:bg-brand-terracotta/10 border border-white/5 hover:border-brand-terracotta/50 rounded-xl cursor-pointer transition-all flex flex-col justify-between h-32"
            >
              <h3 className="font-bold text-lg text-white group-hover:text-brand-terracotta transition-colors">{cat.title}</h3>
              <div className="self-end text-brand-muted group-hover:text-brand-terracotta transform group-hover:translate-x-1 transition-all">
                {cat.icon}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <AuthModal isOpen={authModalOpen} onClose={() => {
        setAuthModalOpen(false);
        if (!isAuthenticated) navigate('/');
      }} />
    </div>
  );
}
