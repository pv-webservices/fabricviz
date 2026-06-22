import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

const PRODUCTS = [
  { name: 'Philus Shepherd', type: 'Jacquard', price: '₹ 845/m', rating: 4.8, image: 'https://images.unsplash.com/photo-1584598173971-b7bcc74b4815?q=80&w=600&auto=format&fit=crop' },
  { name: 'Regal Fern', type: 'Velvet', price: '₹ 1,250/m', rating: 5.0, image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=600&auto=format&fit=crop' },
  { name: 'Radiance Blush', type: 'Sheer Silk', price: '₹ 680/m', rating: 4.5, image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop' },
  { name: 'Amber Weave', type: 'Linen Blend', price: '₹ 450/m', rating: 4.6, image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=600&auto=format&fit=crop' },
  { name: 'Midnight Oasis', type: 'Velvet', price: '₹ 1,100/m', rating: 4.9, image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop' },
  { name: 'Sand Dune', type: 'Outdoor', price: '₹ 950/m', rating: 4.7, image: 'https://images.unsplash.com/photo-1595163901618-9c5957bcf875?q=80&w=600&auto=format&fit=crop' },
  { name: 'Pearl Drop', type: 'Sheer', price: '₹ 380/m', rating: 4.4, image: 'https://images.unsplash.com/photo-1541123437800-1c0c05a10408?q=80&w=600&auto=format&fit=crop' },
  { name: 'Terracotta Rust', type: 'Chenille', price: '₹ 720/m', rating: 4.8, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=600&auto=format&fit=crop' },
];

export default function NewArrivals() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section className="bg-white py-16 md:py-24" ref={ref}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        
        <div className="text-center mb-10 md:mb-16 max-w-2xl mx-auto">
          <span className="text-brand-accent text-[10px] font-bold tracking-widest uppercase mb-2 block">Our Collection</span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-brand-text mb-3"
          >
            New Arrivals
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
            className="text-brand-muted font-light text-sm sm:text-base md:text-lg px-2"
          >
            Discover in-season prints, chic designs, and luxurious textures for your interior space.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-8 sm:gap-y-12">
          {PRODUCTS.map((prod, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden mb-3 sm:mb-5 bg-gray-100">
                <img 
                  src={prod.image} 
                  alt={prod.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex flex-col items-center justify-center gap-3">
                  <button className="bg-white text-brand-text w-3/4 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-brand-accent hover:text-white transition-colors">
                    Quick View
                  </button>
                  <button className="border border-white text-white w-3/4 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-white hover:text-brand-text transition-colors">
                    Add Sample
                  </button>
                </div>

                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-white/95 backdrop-blur text-[8px] sm:text-[10px] font-bold tracking-widest uppercase px-2 sm:px-3 py-1 text-brand-text rounded-sm shadow-sm md:block hidden group-hover:block">
                  {prod.type}
                </div>
              </div>

              <div className="text-center">
                <div className="flex justify-center items-center gap-1 mb-1 sm:mb-2 text-brand-accent text-xs sm:text-sm">
                  {'★'.repeat(Math.round(prod.rating))}
                  <span className="text-gray-200">{'★'.repeat(5 - Math.round(prod.rating))}</span>
                </div>
                <h3 className="font-serif text-lg sm:text-xl text-brand-text mb-1 line-clamp-1">{prod.name}</h3>
                <p className="text-brand-muted text-xs sm:text-sm">{prod.price}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <button className="border border-brand-text text-brand-text px-10 py-4 text-[10px] font-bold tracking-widest uppercase hover:bg-brand-text hover:text-white transition-colors">
            Load More
          </button>
        </div>

      </div>
    </section>
  );
}
