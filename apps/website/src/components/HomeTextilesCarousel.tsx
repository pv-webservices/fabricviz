import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TextileCard {
  image: string;
  name: string;
  code: string;
  active?: boolean;
  order?: number;
}

const CARDS_FALLBACK: TextileCard[] = [
  { image: 'https://images.unsplash.com/photo-1595163901618-9c5957bcf875?q=80&w=800&auto=format&fit=crop', name: 'Outdoor Performance', code: 'All-Weather Durability' },
  { image: 'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?q=80&w=800&auto=format&fit=crop', name: 'Plush Velvet Upholstery', code: 'Indoor Luxury Textures' },
  { image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop', name: 'Linen Curtains & Drapery', code: 'Light Filtering & Sheers' },
  { image: 'https://images.unsplash.com/photo-1584598173971-b7bcc74b4815?q=80&w=800&auto=format&fit=crop', name: 'Heavy Jacquards', code: 'Statement Woven Patterns' },
  { image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop', name: 'Sun-blocking Blackout', code: 'Thermal Window Treatments' },
];

export default function HomeTextilesCarousel() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState<TextileCard[]>(CARDS_FALLBACK);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/homepage/textiles_carousel`);
        if (!res.ok) throw new Error('Failed to fetch textiles_carousel');
        const data = await res.json();
        
        let fetchedCards: TextileCard[] = Array.isArray(data) ? data : (data.textiles_carousel || []);
        fetchedCards = fetchedCards
          .filter((card: TextileCard) => card.active === true)
          .sort((a: TextileCard, b: TextileCard) => (a.order || 0) - (b.order || 0));
        
        if (fetchedCards.length > 0) {
          setCards(fetchedCards);
        }
      } catch (err) {
        console.error('Error fetching textiles data:', err);
      }
    };
    fetchData();
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-brand-dark py-16 md:py-24 text-white overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <motion.div 
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="mb-8 md:mb-12"
        >
          <div className="text-brand-accent tracking-widest text-[10px] font-bold mb-4 uppercase">Home Textiles</div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4">Our Collection</h2>
              <p className="text-white/70 text-base sm:text-lg font-light">
                From upholstery fabrics to wall hangings, explore our full collections and see where your creativity takes you.
              </p>
            </div>
            <div className="flex gap-4 self-start md:self-auto">
              <button onClick={scrollLeft} className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-brand-dark transition-colors">
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button onClick={scrollRight} className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-brand-dark transition-colors">
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        <div 
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto hide-scrollbar snap-x snap-mandatory py-4"
        >
          {cards.map((card, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className="w-[80vw] sm:w-[320px] md:w-[360px] lg:w-[400px] flex-shrink-0 snap-start group cursor-pointer"
            >
              <div className="aspect-[16/10] overflow-hidden rounded-lg mb-4 md:mb-6 relative">
                <img 
                  src={card.image} 
                  alt={card.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div>
                <div className="text-white/60 text-[10px] tracking-widest font-bold uppercase mb-2">
                  {card.code}
                </div>
                <h3 className="font-serif text-xl sm:text-2xl text-white mb-3 group-hover:text-brand-accent transition-colors">
                  {card.name}
                </h3>
                <a href="#" className="inline-flex items-center text-[10px] md:text-xs font-bold tracking-widest uppercase text-white border-b border-brand-accent pb-1 group-hover:text-brand-accent transition-colors">
                  View Product
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
