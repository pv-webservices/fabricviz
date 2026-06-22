import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

const MASONRY_ITEMS = [
  { type: 'image', src: 'https://images.unsplash.com/photo-1595163901618-9c5957bcf875?q=80&w=800&auto=format&fit=crop', alt: 'Outdoor shade sail', span: 'col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2 row-span-1' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1541123437800-1c0c05a10408?q=80&w=800&auto=format&fit=crop', alt: 'Bedroom sheer drapes', span: 'col-span-1 row-span-1 md:row-span-2 lg:row-span-2' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop', alt: 'Roller blind', span: 'col-span-1 row-span-1 md:row-span-2 lg:row-span-2' },
  { type: 'text', title: 'Fabrics, Blinds, Panels & Tracks:', subtitle: 'Your One Stop Shop for All Things Fabric', span: 'col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-1 row-span-1 bg-[#a39a95] text-white', textColor: 'text-white/80' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?q=80&w=800&auto=format&fit=crop', alt: 'Velvet sofa close-up', span: 'col-span-1 row-span-1' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop', alt: 'Paneled wall interior', span: 'col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-1 row-span-1 md:row-span-2 lg:row-span-2' },
  { type: 'text', title: 'Live Better:', subtitle: 'Experience Premium Fabrics — Upholstery, Outdoor & Curtain Solutions', span: 'col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-1 row-span-1 bg-brand-alt text-brand-text', textColor: 'text-brand-muted' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=800&auto=format&fit=crop', alt: 'Velvet texture corner', span: 'col-span-1 row-span-1' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800&auto=format&fit=crop', alt: 'Cozy throw and rug', span: 'col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2 row-span-1' },
];

export default function MasonryGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section className="py-16 md:py-24 max-w-[1440px] mx-auto px-4 md:px-8">
      <div className="text-center mb-10 md:mb-16">
        <span className="text-brand-accent text-[10px] font-bold tracking-widest uppercase mb-2 block">Our Categories</span>
        <h2 className="font-serif text-3xl md:text-5xl text-brand-text mb-3">Product Collections</h2>
        <p className="italic font-sans text-sm md:text-lg text-brand-muted leading-relaxed max-w-2xl mx-auto">
          "Life should be Chic, Glamorous and Colourful — and so should your home!"
        </p>
      </div>

      <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 auto-rows-[200px] md:auto-rows-[250px] lg:auto-rows-[300px]">
        {MASONRY_ITEMS.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, delay: index * 0.08, ease: "easeOut" }}
            className={`relative rounded-lg overflow-hidden group ${item.span}`}
          >
            {item.type === 'image' ? (
              <>
                <img 
                  src={item.src} 
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex flex-col justify-end p-4">
                  <motion.button 
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ scale: 1.05 }}
                    className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-brand-text px-6 py-3 rounded-sm font-bold text-[10px] tracking-widest uppercase self-center mb-4 border border-black/5"
                  >
                    View Collection &rarr;
                  </motion.button>
                </div>
              </>
            ) : (
              <div className={`w-full h-full p-6 md:p-8 flex flex-col justify-center text-left ${item.span.includes('bg-[#a39a95]') ? 'bg-[#a39a95] text-white' : 'bg-brand-alt border border-black/5'}`}>
                <h3 className={`font-serif text-lg md:text-xl leading-snug mb-4 ${item.span.includes('bg-[#a39a95]') ? 'text-white' : 'text-brand-text'}`}>
                  {item.title} <br className="hidden md:block"/> <span className="font-light">{item.subtitle}</span>
                </h3>
                <div className={`w-8 h-[1px] ${item.span.includes('bg-[#a39a95]') ? 'bg-white/40' : 'bg-brand-accent'}`}></div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
