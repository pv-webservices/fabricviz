import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'motion/react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import FabricZoomModal from './FabricZoomModal';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import AuthModal from './AuthModal';

const getImageUrl = (url: string | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function NewArrivals() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFabric, setSelectedFabric] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { favorites, toggleFavorite, isAuthenticated } = useCustomerAuth();

  const handleToggleFavorite = async (fabricId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    await toggleFavorite(fabricId);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/homepage/new_arrivals`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json.data || null);
      } catch (err) {
        console.error('Failed to load new arrivals data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (!loading && (!data || !data.fabrics || data.fabrics.length === 0)) {
    return null; // Gracefully hide if no data or no fabrics
  }

  return (
    <section className="bg-white py-16 md:py-24" ref={ref}>
      {loading ? (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          <div className="text-center mb-10 md:mb-16 max-w-2xl mx-auto space-y-4">
            <div className="h-4 bg-slate-200 w-32 mx-auto rounded animate-pulse" />
            <div className="h-10 bg-slate-200 w-3/4 mx-auto rounded animate-pulse" />
            <div className="h-6 bg-slate-200 w-full mx-auto rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-8 sm:gap-y-12">
            {[1,2,3,4,5,6,7,8].map((i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-square bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-6 bg-slate-200 w-3/4 mx-auto rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        
        <div className="text-center mb-10 md:mb-16 max-w-2xl mx-auto">
          {data.tag_label && (
            <span className="text-brand-accent text-[10px] font-bold tracking-widest uppercase mb-2 block">
              {data.tag_label}
            </span>
          )}
          {data.section_title && (
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              className="font-serif text-3xl sm:text-4xl md:text-5xl text-brand-text mb-3"
            >
              {data.section_title}
            </motion.h2>
          )}
          {data.subheading && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.1 }}
              className="text-brand-muted font-light text-sm sm:text-base md:text-lg px-2"
            >
              {data.subheading}
            </motion.p>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-8 sm:gap-y-12">
          {data.fabrics.slice(0, 8).map((fabric: any, index: number) => (
            <motion.div
              key={fabric.id || index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden mb-3 sm:mb-5 bg-gray-100">
                {(fabric.swatch_url || fabric.texture_url) ? (
                  <img 
                    src={getImageUrl(fabric.swatch_url || fabric.texture_url)} 
                    alt={fabric.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 text-sm">
                    No Image
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex flex-col items-center justify-center gap-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFabric(fabric);
                    }}
                    className="bg-white text-brand-text w-3/4 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-brand-accent hover:text-white transition-colors"
                  >
                    Quick View
                  </button>
                </div>

                {/* Mobile tap target for Quick View */}
                <button
                  className="md:hidden absolute inset-0 w-full h-full z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFabric(fabric);
                  }}
                  aria-label={`Quick view ${fabric.name}`}
                />

                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20">
                  <button 
                    onClick={(e) => handleToggleFavorite(fabric.id, e)}
                    className={`p-1.5 shadow-sm rounded-full transition-colors opacity-100 ${favorites.includes(fabric.id) ? 'bg-brand-terracotta text-white' : 'bg-white/90 hover:bg-white text-brand-accent md:opacity-0 md:group-hover:opacity-100'}`}
                  >
                    <Heart size={14} className={favorites.includes(fabric.id) ? "fill-white" : "fill-transparent hover:fill-current"} />
                  </button>
                </div>

                {fabric.quality && (
                  <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-white/95 backdrop-blur text-[8px] sm:text-[10px] font-bold tracking-widest uppercase px-2 sm:px-3 py-1 text-brand-text rounded-sm shadow-sm md:block hidden group-hover:block">
                    {fabric.quality}
                  </div>
                )}
              </div>

              <div className="text-center">
                <h3 className="font-serif text-lg sm:text-xl text-brand-text mb-1 line-clamp-1">{fabric.name}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        {data.cta_collection_id && data.cta_text && (
          <div className="mt-12 sm:mt-16 text-center">
            {/* CANONICAL COLLECTION ROUTE: /collections/:slug or /collections/:id */}
            <Link 
              to={`/collections/${data.cta_collection_slug || data.cta_collection_id}`}
              className="border border-brand-text text-brand-text px-10 py-4 text-[10px] font-bold tracking-widest uppercase hover:bg-brand-text hover:text-white transition-colors inline-block"
            >
              {data.cta_text}
            </Link>
          </div>
        )}

      </div>
      )}

      {selectedFabric && (
        <FabricZoomModal 
          fabric={selectedFabric}
          collection={{ name: selectedFabric.collection_name, slug: selectedFabric.collection_slug }}
          onClose={() => setSelectedFabric(null)}
        />
      )}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </section>
  );
}
