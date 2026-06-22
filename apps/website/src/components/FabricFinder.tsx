import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

export default function FabricFinder() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section className="bg-brand-bg overflow-hidden" ref={ref}>
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row min-h-[500px] lg:min-h-[700px]">
          
          {/* Left Side: Image */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full lg:w-1/2 relative bg-brand-alt flex items-center justify-center p-6 md:p-12 lg:p-16 min-h-[350px]"
          >
            {/* Using a placeholder aesthetic image for swatch flat lay */}
            <div className="relative w-full max-w-[350px] md:max-w-[500px] aspect-square rounded-lg overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=1200&auto=format&fit=crop" 
                  alt="Fabric swatches" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-white px-3 py-1.5 md:px-4 md:py-2 text-[10px] font-bold tracking-widest text-brand-text uppercase shadow-sm">
                  GUIDED MATCH
                </div>
            </div>
          </motion.div>

          {/* Right Side: Content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="w-full lg:w-1/2 flex items-center p-8 md:p-16 lg:px-24"
          >
            <div className="max-w-xl">
              <div className="text-brand-accent tracking-widest text-[10px] font-bold mb-4 md:mb-6 flex items-center gap-3 uppercase">
                <span className="w-8 h-[1px] bg-brand-accent"></span>
                FIND YOUR FABRIC
                <span className="w-8 h-[1px] bg-brand-accent"></span>
              </div>
              
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-brand-text mb-4 md:mb-6 leading-[1.1]">
                Not sure where to start? <br />
                <span className="italic text-brand-accent">Let us guide you.</span>
              </h2>
              
              <p className="text-brand-muted text-base md:text-lg tracking-wide font-light mb-8 md:mb-12">
                Answer a few quick questions about your project — we'll match you with the perfect curtain or upholstery fabric for your application, durability needs, and aesthetic.
              </p>

              <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
                {[
                  "Tell us about your space & how you'll use it",
                  "Share your style and color preferences",
                  "Get a curated edit with free samples"
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-4 md:gap-6 items-start">
                    <span className="font-serif italic text-brand-accent text-xl md:text-2xl mt-0.5">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-light text-brand-text text-sm md:text-base pt-1">
                      {step}
                    </span>
                  </div>
                ))}
              </div>

              <a href={import.meta.env.VITE_APP_URL || 'http://localhost:3000'} className="w-full sm:w-auto inline-flex bg-brand-dark text-white px-8 py-4 text-[10px] font-bold tracking-widest uppercase hover:bg-brand-accent transition-colors mb-6 items-center justify-center gap-2">
                Start The Fabric Finder &rarr;
              </a>
              
              <a href="#" className="inline-block text-brand-muted text-[11px] md:text-xs font-bold uppercase tracking-widest hover:text-brand-accent transition-colors">
                Prefer to see fabrics in person? <span className="underline underline-offset-4 decoration-black/20 text-brand-text hover:decoration-brand-accent">Find a showroom &rarr;</span>
              </a>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
