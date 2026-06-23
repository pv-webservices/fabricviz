import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroBanner {
  image: string;
  tagLabel?: string;
  headline: string;
  subtext: string;
  cta1_text?: string;
  cta1_link?: string;
  cta2_text?: string;
  cta2_link?: string;
  active?: boolean;
  order?: number;
}

const SLIDES_FALLBACK: HeroBanner[] = [
  {
    image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=2070&auto=format&fit=crop',
    headline: 'Texture That Speaks',
    subtext: 'Premium curtain & sofa fabrics for designers, architects & retailers.',
  },
  {
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop',
    headline: 'Light. Air. Elegance.',
    subtext: 'Sheer perfection to transform your natural light boundaries.',
  },
  {
    image: 'https://images.unsplash.com/photo-1584598173971-b7bcc74b4815?q=80&w=2070&auto=format&fit=crop',
    headline: 'Wholesale Craftsmanship',
    subtext: 'Rich jacquards and brocades sourced directly from the finest mills.',
  },
  {
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop',
    headline: 'Design Without Compromise',
    subtext: 'Curated layers of modern drapery for the sophisticated interior.',
  }
];

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState<HeroBanner[]>(SLIDES_FALLBACK);
  const [runningText, setRunningText] = useState<string>("Velvet • Chenille • Jacquard • Linen • Silk • Sheer • Blackout • Performance • Faux Leather • Suede • Brocade");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [heroRes, runningRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/homepage/hero_banners`),
          fetch(`${import.meta.env.VITE_API_URL}/api/homepage/running_bar`).catch(() => null)
        ]);

        if (heroRes.ok) {
          const json = await heroRes.json();
          const data = json.success ? json.data : null;
          if (data && data.items && data.items.length > 0) {
            let fetchedSlides = data.items
              .filter((slide: HeroBanner) => slide.active !== false)
              .sort((a: HeroBanner, b: HeroBanner) => (a.order || 0) - (b.order || 0));
            setSlides(fetchedSlides);
          }
        }

        if (runningRes && runningRes.ok) {
          const json = await runningRes.json();
          const rbData = json.success ? json.data : null;
          if (rbData && rbData.text) {
            setRunningText(rbData.text);
          }
        }
      } catch (err) {
        console.error('Error fetching hero data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full aspect-[3/4] sm:aspect-[16/9] md:aspect-[2/1] lg:min-h-[85vh] bg-brand-dark overflow-hidden group">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center origin-center transition-transform duration-[10000ms] ease-linear scale-110"
            style={{ backgroundImage: `url(${(() => {
              const url = slides[currentIndex]?.mediaUrl || slides[currentIndex]?.image || '';
              if (!url) return '';
              if (url.startsWith('http')) return url;
              return `${import.meta.env.VITE_API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
            })()})` }}
          />
          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#1E1A14]/95 via-[#1E1A14]/70 md:via-[#1E1A14]/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 w-full h-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 flex flex-col justify-center gap-2 pt-28 sm:pt-32 pb-24 sm:pb-20">
        <div className="max-w-3xl text-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={`h-${currentIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {slides[currentIndex]?.tagLabel && (
                <span className="text-brand-accent text-[10px] sm:text-xs font-bold tracking-[0.3em] mb-3 sm:mb-4 uppercase block">
                  {slides[currentIndex].tagLabel}
                </span>
              )}
              <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[80px] leading-[0.9] mb-4 sm:mb-6">
                {slides[currentIndex]?.headline}
              </h1>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p
              key={`p-${currentIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-white/80 text-base sm:text-lg md:text-xl font-light mb-8 max-w-sm sm:max-w-lg leading-relaxed"
            >
              {slides[currentIndex]?.subtext}
            </motion.p>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`b-${currentIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 max-w-sm sm:max-w-none"
            >
              {slides[currentIndex]?.cta1_text && (
                <a href={slides[currentIndex].cta1_link || '#'} className="bg-brand-accent text-white px-6 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-yellow-700 transition-colors">
                  {slides[currentIndex].cta1_text} <span className="text-lg">&rarr;</span>
                </a>
              )}
              {slides[currentIndex]?.cta2_text && (
                <a href={slides[currentIndex].cta2_link || '#'} className="border border-white/40 text-white px-6 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-xs font-bold tracking-widest uppercase hover:bg-white/10 transition-colors text-center inline-block">
                  {slides[currentIndex].cta2_text}
                </a>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Texture Strip (Animated Bottom Marquee) */}
      <div className="absolute bottom-0 left-0 w-full h-8 sm:h-12 bg-black/20 backdrop-blur-sm flex items-center overflow-hidden z-20">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 25, repeat: Infinity }}
          className="flex gap-8 sm:gap-12 whitespace-nowrap text-white/40 text-[8px] sm:text-[10px] font-bold tracking-widest uppercase pl-4 sm:pl-16 pt-1"
        >
          <span>{runningText}</span>
          <span>{runningText}</span>
          <span>{runningText}</span>
          <span>{runningText}</span>
          <span>{runningText}</span>
        </motion.div>
      </div>

      {/* Nav Controls */}
      <div className="absolute right-4 sm:right-8 lg:right-12 top-1/2 -translate-y-1/2 z-20 flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
        <button
          onClick={prevSlide}
          className="p-3 sm:p-4 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all hover:scale-105"
        >
          <ChevronLeft className="w-6 h-6 stroke-[1.5] -translate-x-[1px]" />
        </button>
        <button
          onClick={nextSlide}
          className="p-3 sm:p-4 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all hover:scale-105"
        >
          <ChevronRight className="w-6 h-6 stroke-[1.5] translate-x-[1px]" />
        </button>
      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-12 sm:bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1 transition-all duration-300 ${idx === currentIndex ? 'w-6 sm:w-8 bg-brand-accent' : 'w-3 sm:w-4 bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}
