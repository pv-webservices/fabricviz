import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Factory, SwatchBook, Pipette, Star } from 'lucide-react';

const USPS = [
  { 
    icon: Factory, 
    title: "Direct Mill Pricing", 
    desc: "Skip the middleman. Get wholesale rates directly from our manufacturing unit." 
  },
  { 
    icon: SwatchBook, 
    title: "500+ Fabric SKUs", 
    desc: "Velvet, linen, jacquard, sheer, outdoor — the most diverse catalog in India." 
  },
  { 
    icon: Pipette, 
    title: "Custom Dyeing & Finishing", 
    desc: "Pantone-matched custom orders available for bulk requirements." 
  },
  { 
    icon: Star, 
    title: "Dedicated Trade Program", 
    desc: "Exclusive pricing, priority sampling and credit terms for designers & retailers." 
  },
];

export default function USPBand() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section className="bg-brand-dark text-white py-16 md:py-20" ref={ref}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-8">
          {USPS.map((usp, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="flex flex-col items-center text-center px-4"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mb-3 md:mb-4 text-brand-accent">
                <usp.icon strokeWidth={1} className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h3 className="font-serif text-lg md:text-xl mb-2 md:mb-3 text-white">
                {usp.title}
              </h3>
              <p className="text-white/60 text-xs md:text-sm font-light leading-relaxed max-w-xs mx-auto">
                {usp.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
