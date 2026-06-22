import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Shield, Leaf, Factory, PawPrint, Package } from 'lucide-react';

const STATS = [
  { icon: Leaf, title: "OEKO-TEX Certified", subtitle: "THE SAFE CHOICE" },
  { icon: Factory, title: "Direct from Mill", subtitle: "SINCE 2005" },
  { icon: PawPrint, title: "Stain Guard Technology", subtitle: "PET & KID FRIENDLY" },
  { icon: Package, title: "Pan-India Delivery", subtitle: "FREE ABOVE ₹25,000" },
];

export default function StatsBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <div className="w-full bg-brand-alt border-b border-black/5" ref={ref}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 lg:gap-y-0 gap-x-4 md:gap-x-8 lg:divide-x divide-black/10">
          {STATS.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col md:flex-row items-center justify-center md:justify-center text-center md:text-left gap-3 md:gap-5"
            >
              <stat.icon className="w-8 h-8 text-brand-text stroke-[1.5] shrink-0" />
              <div>
                <h3 className="font-sans font-bold text-[10px] sm:text-xs tracking-tighter uppercase mb-0.5 sm:mb-1">
                  {stat.title}
                </h3>
                <p className="text-[9px] sm:text-[10px] text-brand-muted uppercase tracking-widest">
                  {stat.subtitle}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
