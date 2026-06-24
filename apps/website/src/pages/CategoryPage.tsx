import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

interface CategoryPageProps {
  endUse?: string;
}

export default function CategoryPage({ endUse: endUseProp }: CategoryPageProps) {
  const { endUse: endUseParam } = useParams();
  const endUse = endUseProp || endUseParam;
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      setLoading(true);
      try {
        const actualEndUse = endUse?.toLowerCase().replace('_fabric', '').replace('fabric_', '').trim();
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/collections?endUse=${actualEndUse}&limit=100`);
        const json = await res.json();
        if (json.success) {
          setCollections(json.data.items || []);
        }
      } catch (err) {
        console.error('Failed to fetch collections', err);
      } finally {
        setLoading(false);
      }
    };
    if (endUse) fetchCollections();
  }, [endUse]);

  const categoryTitle = endUse ? endUse.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Category';

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${url}`;
  };

  return (
    <div className="min-h-screen bg-brand-dark pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-[1440px] mx-auto">
        <Link to="/" className="text-brand-muted hover:text-brand-accent text-sm font-semibold tracking-wide flex items-center gap-2 mb-8 transition-colors">
          &larr; Back to home
        </Link>
        
        <h1 className="font-serif text-4xl md:text-5xl text-white mb-2">
          {categoryTitle} Fabric
        </h1>
        <p className="text-brand-muted mb-12">Browse all catalogs in this category</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-accent"></div>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-20 text-brand-muted">
            No collections found for this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {collections.map(collection => (
              <Link 
                key={collection.id} 
                to={`/catalog/${collection.id}`}
                className="group rounded-xl overflow-hidden bg-brand-alt/5 border border-white/5 hover:border-brand-accent transition-colors block"
              >
                <div className="aspect-square relative overflow-hidden bg-brand-dark/50">
                  {collection.thumbnail_url || collection.texture_url ? (
                    <img 
                      src={getImageUrl(collection.thumbnail_url || collection.texture_url)} 
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>
                  )}
                </div>
                <div className="p-4 bg-brand-dark">
                  <h3 className="font-bold text-white tracking-wide uppercase text-sm mb-1">{collection.name}</h3>
                  <p className="text-brand-muted text-xs">View Collection</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
