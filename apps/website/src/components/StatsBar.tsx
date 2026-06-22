import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'motion/react';
import * as LucideIcons from 'lucide-react';

interface StatItem {
  icon: string;
  title: string;
  subtitle: string;
  active?: boolean;
  order?: number;
}

const STATS_FALLBACK: StatItem[] = [
  { icon: 'Leaf', title: "OEKO-TEX Certified", subtitle: "THE SAFE CHOICE" },
  { icon: 'Factory', title: "Direct from Mill", subtitle: "SINCE 2005" },
  { icon: 'PawPrint', title: "Stain Guard Technology", subtitle: "PET & KID FRIENDLY" },
  { icon: 'Package', title: "Pan-India Delivery", subtitle: "FREE ABOVE ₹25,000" },
];

export default function StatsBar() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [stats, setStats] = useState<StatItem[]>(STATS_FALLBACK);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/homepage/stats_bar`);
        if (!res.ok) throw new Error('Failed to fetch stats_bar');
        const data = await res.json();
        
        let fetchedStats: StatItem[] = Array.isArray(data) ? data : (data.stats_bar || []);
        fetchedStats = fetchedStats
          .filter((stat: StatItem) => stat.active === true)
          .sort((a: StatItem, b: StatItem) => (a.order || 0) - (b.order || 0));
        
        if (fetchedStats.length > 0) {
          setStats(fetchedStats);
        }
      } catch (err) {
        console.error('Error fetching stats data:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="w-full bg-brand-alt border-b border-black/5" ref={ref}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 lg:gap-y-0 gap-x-4 md:gap-x-8 lg:divide-x divide-black/10">
          {stats.map((stat, index) => {
            const IconComponent = (LucideIcons as any)[stat.icon] || LucideIcons.Shield;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col md:flex-row items-center justify-center md:justify-center text-center md:text-left gap-3 md:gap-5"
              >
                <IconComponent className="w-8 h-8 text-brand-text stroke-[1.5] shrink-0" />
                <div>
                  <h3 className="font-sans font-bold text-[10px] sm:text-xs tracking-tighter uppercase mb-0.5 sm:mb-1">
                    {stat.title}
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-brand-muted uppercase tracking-widest">
                    {stat.subtitle}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
