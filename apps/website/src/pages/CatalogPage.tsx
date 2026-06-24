import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Eye, ZoomIn } from 'lucide-react';
import FabricZoomModal from '../components/FabricZoomModal';

export default function CatalogPage() {
  const { id } = useParams();
  const [collection, setCollection] = useState<any>(null);
  const [fabrics, setFabrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedFabric, setSelectedFabric] = useState<any>(null);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Initialize favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('fabricviz_favorites');
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse favorites');
      }
    }
  }, []);

  const toggleFavorite = (fabricId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let newFavorites;
    if (favorites.includes(fabricId)) {
      newFavorites = favorites.filter(id => id !== fabricId);
    } else {
      newFavorites = [...favorites, fabricId];
    }
    setFavorites(newFavorites);
    localStorage.setItem('fabricviz_favorites', JSON.stringify(newFavorites));
  };

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const [collRes, fabRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/collections/${id}`),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/fabrics?collectionId=${id}&limit=100`)
        ]);
        
        const collJson = await collRes.json();
        const fabJson = await fabRes.json();
        
        if (collJson.success) {
          setCollection(collJson.data);
        }
        if (fabJson.success) {
          setFabrics(fabJson.data.items || []);
        }
      } catch (err) {
        console.error('Failed to fetch catalog', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCatalog();
  }, [id]);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${url}`;
  };

  const displayedFabrics = showFavoritesOnly 
    ? fabrics.filter(f => favorites.includes(f.id))
    : fabrics;

  return (
    <div className="min-h-screen bg-brand-dark pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-[1440px] mx-auto">
        <Link to="/" className="text-brand-muted hover:text-brand-accent text-sm font-semibold tracking-wide flex items-center gap-2 mb-8 transition-colors">
          &larr; Back to home
        </Link>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-accent"></div>
          </div>
        ) : !collection ? (
          <div className="text-center py-20 text-brand-muted">
            Collection not found.
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-6 mb-12 items-start">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-brand-alt/10 rounded-xl overflow-hidden shadow-lg shrink-0">
                {collection.thumbnail_url ? (
                  <img src={getImageUrl(collection.thumbnail_url)} alt={collection.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">No Image</div>
                )}
              </div>
              <div>
                <h1 className="font-serif text-4xl md:text-5xl text-white mb-2 uppercase tracking-wide">
                  {collection.name}
                </h1>
                <p className="text-brand-muted mb-4">{fabrics.length} items in this catalog</p>
                
                <button 
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`px-6 py-2.5 rounded-md font-semibold flex items-center gap-2 transition-colors text-sm tracking-wide ${showFavoritesOnly ? 'bg-brand-accent text-white' : 'bg-brand-terracotta hover:opacity-90 text-white'}`}
                >
                  <Heart size={16} className={showFavoritesOnly ? "fill-white" : ""} /> 
                  {showFavoritesOnly ? "View All Fabrics" : "View your favorites"}
                </button>
                <p className="text-brand-muted text-xs mt-3 italic">
                  (Click on the swatch below to select your favorites from this catalog.)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {displayedFabrics.map((fabric) => (
                <div key={fabric.id} className="group flex flex-col cursor-pointer" onClick={() => setSelectedFabric(fabric)}>
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-brand-alt/10 mb-2 shadow-md">
                    {fabric.swatch_url ? (
                      <img 
                        src={getImageUrl(fabric.swatch_url)} 
                        alt={fabric.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>
                    )}
                    
                    {/* Floating Action Buttons */}
                    <div className="absolute inset-0 p-2 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                      <div className="flex justify-between w-full">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedFabric(fabric); }}
                          className="p-1.5 bg-black/40 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-colors border border-white/20"
                        >
                          <span className="sr-only">Zoom in</span>
                          <ZoomIn size={14} />
                        </button>
                        <button 
                          onClick={(e) => toggleFavorite(fabric.id, e)}
                          className={`p-1.5 shadow-sm rounded-full transition-colors ${favorites.includes(fabric.id) ? 'bg-brand-terracotta text-white' : 'bg-white hover:bg-gray-50 text-brand-accent'}`}
                        >
                          <Heart size={14} className={favorites.includes(fabric.id) ? "fill-white" : "fill-transparent hover:fill-current"} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-brand-dark p-3 rounded-b-lg border border-t-0 border-white/5 flex justify-between items-end mt-[-8px] pt-4 relative z-10">
                    <div>
                      <h3 className="font-bold text-white text-xs uppercase tracking-wide truncate max-w-[100px]">{fabric.name}</h3>
                      <p className="text-brand-muted text-[10px] font-mono">{fabric.code}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedFabric(fabric); }}
                      className="p-1.5 bg-brand-accent text-white rounded-full hover:bg-brand-accent/80 transition-colors shadow-md"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {displayedFabrics.length === 0 && (
              <div className="text-center py-20 text-brand-muted">
                {showFavoritesOnly ? "No favorited fabrics in this catalog." : "No fabrics found in this catalog."}
              </div>
            )}
          </>
        )}

        {selectedFabric && (
          <FabricZoomModal 
            fabric={selectedFabric} 
            collection={collection} 
            onClose={() => setSelectedFabric(null)} 
          />
        )}
      </div>
    </div>
  );
}
