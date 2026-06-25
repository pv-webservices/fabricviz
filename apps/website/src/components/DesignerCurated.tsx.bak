import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const COLLECTIONS = [
  { name: 'Savannah', desc: 'Soft neutrals & quiet pattern', image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=600&auto=format&fit=crop' },
  { name: 'Coastal Escape', desc: 'Washed linens & sea breeze', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop' },
  { name: 'Regal Noir', desc: 'Deep velvet & dramatic rich tones', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop' },
  { name: 'Terra Verde', desc: 'Earthy organics & botanical', image: 'https://images.unsplash.com/photo-1595163901618-9c5957bcf875?q=80&w=600&auto=format&fit=crop' },
  { name: 'Indus Weave', desc: 'Heritage jacquards & craft', image: 'https://images.unsplash.com/photo-1584598173971-b7bcc74b4815?q=80&w=600&auto=format&fit=crop' },
];

export default function DesignerCurated() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-brand-alt py-16 md:py-24 overflow-hidden" ref={ref}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-black/5 pb-6 md:pb-8 mb-8 md:mb-12"
        >
          <div className="max-w-2xl">
            <div className="text-brand-accent tracking-widest text-[10px] font-bold mb-3 uppercase">
              Designer Curated
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-[44px] text-brand-text mb-2 md:mb-4 leading-tight">
              Signature Collections
            </h2>
            <p className="text-brand-muted text-base md:text-lg">
              Performance fabric collections curated for cohesive interior design.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-4 md:gap-6 w-full md:w-auto justify-between">
            <a href={import.meta.env.VITE_APP_URL || 'http://localhost:3000'} className="flex items-center text-[10px] font-bold tracking-widest uppercase border-b border-brand-text pb-1 hover:text-brand-accent hover:border-brand-accent transition-colors">
              View All Collections &rarr;
            </a>
            <div className="flex gap-2">
              <button onClick={scrollLeft} className="w-10 h-10 border border-brand-text/20 rounded-full flex items-center justify-center hover:bg-brand-text hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={scrollRight} className="w-10 h-10 border border-brand-text/20 rounded-full flex items-center justify-center hover:bg-brand-text hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="relative">
          <div 
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto hide-scrollbar snap-x snap-mandatory py-4 px-2 -mx-2"
          >
            {COLLECTIONS.map((col, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="w-[85vw] min-w-[280px] sm:w-[320px] sm:min-w-[320px] isolate snap-start cursor-pointer group flex-shrink-0"
              >
                <div className="aspect-[4/3] bg-white rounded-lg p-2 shadow-sm mb-4 md:mb-6 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl border border-black/5">
                  <div className="w-full h-full rounded bg-gray-100 overflow-hidden">
                    <img 
                      src={col.image} 
                      alt={col.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                </div>
                <div className="px-2">
                  <h3 className="font-serif text-xl md:text-2xl text-brand-text mb-1 group-hover:text-brand-accent transition-colors">
                    {col.name}
                  </h3>
                  <p className="text-brand-muted text-sm font-light">
                    {col.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
