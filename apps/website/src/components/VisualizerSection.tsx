import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon } from 'lucide-react';

const DEFAULT_DATA = {
  media_type: 'image',
  image_url: null,
  video_url: null,
  fallback_image_url: null,
  tag_label: 'VISUALIZE YOUR SPACE',
  heading_line1: 'See Your Fabric',
  heading_line2: 'Before You Buy.',
  body: 'Upload a room photo, choose your fabric, and instantly see how it looks in your space — before ordering a single metre.',
  bullets: [
    'Upload your room photo',
    'Browse and select any fabric',
    'See it visualized in real-time',
    'Save and share your favorites'
  ],
  cta_text: 'LAUNCH THE VISUALIZER →',
  cta_link: '',
  secondary_link_text: '',
  secondary_link_url: ''
};

const getMediaUrl = (url: string | null) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function VisualizerSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/homepage/visualizer_section`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json.data || DEFAULT_DATA);
      } catch (err) {
        console.error('Failed to load visualizer section data:', err);
        setData(DEFAULT_DATA);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <section className="relative bg-white py-16 md:py-24">
        <div className="absolute top-0 left-0 w-full h-[500px] md:h-full md:w-1/2 bg-brand-alt z-0" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center gap-12 md:gap-16">
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="w-[230px] aspect-[9/16] bg-slate-200 rounded-[2.5rem] animate-pulse" />
          </div>
          <div className="w-full md:w-1/2 space-y-6">
            <div className="h-4 bg-slate-200 w-32 rounded animate-pulse" />
            <div className="h-10 bg-slate-200 w-3/4 rounded animate-pulse" />
            <div className="h-10 bg-slate-200 w-1/2 rounded animate-pulse" />
            <div className="h-24 bg-slate-200 w-full rounded animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  const content = data || DEFAULT_DATA;
  const ctaUrl = content.cta_link || import.meta.env.VITE_APP_URL || '/login';
  
  return (
    <section className="relative bg-white overflow-hidden py-16 md:py-24">
      {/* Background that spans full height on desktop, but only covers the phone frame area on mobile */}
      <div className="absolute top-0 left-0 w-full h-[550px] md:h-full md:w-1/2 bg-brand-alt z-0" />

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center gap-12 md:gap-16">
        
        {/* Left Panel: Media */}
        <div className="w-full md:w-1/2 flex items-center justify-center mb-8 md:mb-0 relative">
          
          <div className="relative inline-flex flex-col items-center">
            {/* LIVE PREVIEW Badge */}
            <div className="absolute -top-3 -left-3 bg-white text-[#111] text-[9px] font-bold tracking-widest uppercase px-3 py-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.12)] z-20">
              LIVE PREVIEW
            </div>

            {/* Phone Bezel */}
            <div className="bg-[#111] rounded-[2.5rem] p-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.10)] inline-block relative">
              
              {/* Screen Area */}
              <div className="relative overflow-hidden bg-black rounded-[2rem] w-[230px] md:w-[273px] lg:w-[315px] aspect-[9/16]">
                
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[60px] h-[18px] bg-[#111] rounded-full z-10" />

                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[60px] h-[4px] bg-white/35 rounded-full z-10" />

                {/* Media Content */}
                {content.media_type === 'video' && content.video_url ? (
                  <video
                    src={getMediaUrl(content.video_url)}
                    poster={getMediaUrl(content.fallback_image_url)}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : content.media_type === 'image' && content.image_url ? (
                  <img
                    src={getMediaUrl(content.image_url)}
                    alt={content.heading_line1}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gray-100 flex flex-col items-center justify-center">
                    <p className="text-sm text-gray-500">No media uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Content */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          
          {/* Tag Label */}
          {content.tag_label && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-[1px] bg-brand-accent/30 max-w-[40px]"></div>
              <span className="text-brand-accent text-[10px] font-bold tracking-widest uppercase whitespace-nowrap">
                {content.tag_label}
              </span>
              <div className="flex-1 h-[1px] bg-brand-accent/30 max-w-[40px]"></div>
            </div>
          )}

          {/* Heading */}
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-brand-text mb-6">
            {content.heading_line1 && <span className="block mb-2">{content.heading_line1}</span>}
            {content.heading_line2 && <span className="block italic text-brand-accent">{content.heading_line2}</span>}
          </h2>

          {/* Body */}
          {content.body && (
            <p className="font-sans font-light text-brand-muted text-base md:text-lg leading-relaxed mb-8 max-w-xl">
              {content.body}
            </p>
          )}

          {/* Bullets */}
          {content.bullets && content.bullets.length > 0 && (
            <ul className="space-y-4 mb-10 max-w-xl">
              {content.bullets.map((bullet: string, idx: number) => (
                <li key={idx} className="flex items-start gap-4">
                  <span className="font-serif text-brand-accent italic min-w-[28px] text-[1.1em] md:text-[1.2em] mt-0.5">0{idx + 1}</span>
                  <span className="font-sans text-brand-text text-[1.1em] leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          {/* CTA & Secondary Link */}
          <div className="flex flex-col items-start gap-4 mt-auto md:mt-0 pt-4">
            <a
              href={ctaUrl}
              className="bg-brand-terracotta text-white px-8 py-4 uppercase font-bold tracking-widest text-xs rounded-sm hover:bg-brand-terracotta/90 transition-colors inline-block"
            >
              {content.cta_text || 'LAUNCH THE VISUALIZER →'}
            </a>

            {content.secondary_link_text && (
              <Link
                to={content.secondary_link_url || '/'}
                className="text-[10px] uppercase tracking-widest text-brand-muted hover:text-brand-text transition-colors mt-2"
              >
                {content.secondary_link_text}
              </Link>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
