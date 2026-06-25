import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { motion, useInView } from 'motion/react';
import { Link } from 'react-router-dom';

const getImageUrl = (url: string | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsToShow, setCardsToShow] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/homepage/testimonials_section`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json.data || null);
      } catch (err) {
        console.error('Failed to load testimonials data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCardsToShow(1);
      } else if (window.innerWidth < 1024) {
        setCardsToShow(2);
      } else {
        setCardsToShow(3);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalCards = data?.testimonials?.length || 0;
  const maxIndex = Math.max(0, totalCards - cardsToShow);

  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev < maxIndex ? prev + 1 : 0));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
  }, [maxIndex]);

  // Auto-advance
  useEffect(() => {
    if (!isPaused && totalCards > cardsToShow) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [isPaused, totalCards, cardsToShow, nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
    touchStartX.current = null;
  };

  if (!loading && (!data || !data.testimonials || data.testimonials.length === 0)) {
    return null;
  }

  return (
    <section className="bg-brand-alt py-16 md:py-24 overflow-hidden relative" ref={ref}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12 md:mb-16"
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-brand-accent"></span>
              <span className="text-brand-accent text-[10px] font-bold tracking-widest uppercase">
                {loading ? 'LOADING...' : data?.tag_label || 'TESTIMONIALS'}
              </span>
              <span className="w-8 h-px bg-brand-accent"></span>
            </div>
            
            {loading ? (
              <div className="space-y-4">
                <div className="h-10 bg-black/5 w-3/4 rounded animate-pulse" />
                <div className="h-6 bg-black/5 w-full rounded animate-pulse" />
              </div>
            ) : (
              <>
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-brand-text mb-4 leading-tight">
                  {data?.heading}
                </h2>
                {data?.subheading && (
                  <p className="font-sans font-light text-base md:text-lg text-brand-muted">
                    {data.subheading}
                  </p>
                )}
              </>
            )}
          </div>
          
          {/* Navigation Controls */}
          {!loading && totalCards > cardsToShow && (
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="rounded-full w-10 h-10 bg-brand-alt text-brand-text flex items-center justify-center border border-brand-muted/20 hover:bg-brand-text hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={nextSlide}
                disabled={currentIndex === maxIndex}
                className="rounded-full w-10 h-10 bg-brand-alt text-brand-text flex items-center justify-center border border-brand-muted/20 hover:bg-brand-text hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Carousel */}
        <div 
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {loading ? (
            <div className="flex gap-4 md:gap-6 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-black/5 rounded-2xl p-6 md:p-8 min-w-[100%] md:min-w-[calc(50%-12px)] lg:min-w-[calc(33.333%-16px)] animate-pulse">
                  <div className="h-12 w-12 bg-black/5 rounded-full mb-4" />
                  <div className="h-4 bg-black/5 w-full mb-2" />
                  <div className="h-4 bg-black/5 w-3/4 mb-6" />
                  <div className="flex gap-3 items-center">
                    <div className="w-11 h-11 bg-black/5 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-3 bg-black/5 w-24" />
                      <div className="h-2 bg-black/5 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden pb-4 -mx-2 px-2">
              <div 
                className="flex transition-transform duration-500 ease-in-out gap-4 md:gap-6"
                style={{ 
                  transform: `translateX(calc(-${currentIndex * (100 / cardsToShow)}% - ${currentIndex * (16 / cardsToShow)}px))` 
                }}
              >
                {data.testimonials.map((t: any) => (
                  <div 
                    key={t.id} 
                    className="bg-white border border-black/5 shadow-sm rounded-2xl p-6 md:p-8 shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex flex-col"
                  >
                    <div className="font-serif text-5xl md:text-6xl text-brand-accent opacity-60 leading-[0] mb-[-8px]">
                      &ldquo;
                    </div>
                    <p className="font-serif italic text-lg md:text-xl text-brand-text leading-relaxed flex-1 mt-6">
                      {t.quote}
                    </p>
                    <div className="w-12 h-px bg-brand-accent/40 mt-6 mb-4"></div>
                    
                    {t.rating > 0 && (
                      <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < t.rating ? 'fill-brand-accent text-brand-accent' : 'fill-brand-muted/20 text-brand-muted/20'}`} 
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {t.author_photo_url ? (
                        <img 
                          src={getImageUrl(t.author_photo_url)} 
                          alt={t.author_name} 
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-brand-alt"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-brand-accent/20 text-brand-accent text-sm font-bold flex items-center justify-center ring-2 ring-brand-alt uppercase">
                          {t.author_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="font-sans font-semibold text-sm text-brand-text">
                          {t.author_name}
                        </div>
                        {(t.author_role || t.author_company) && (
                          <div className="font-sans text-xs text-brand-muted">
                            {t.author_role}{t.author_role && t.author_company ? ', ' : ''}{t.author_company}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dots */}
        {!loading && totalCards > cardsToShow && (
          <div className="flex justify-center gap-2 mt-8">
            {[...Array(maxIndex + 1)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 bg-brand-accent' : 'w-2 bg-brand-muted/30'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}


      </div>

      {/* Marquee Background row */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden opacity-5 pointer-events-none select-none z-0">
        <div className="whitespace-nowrap flex animate-[marquee_20s_linear_infinite]">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className="text-[120px] font-serif font-bold text-brand-text px-8">
              TESTIMONIALS • REVIEWS •
            </span>
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
