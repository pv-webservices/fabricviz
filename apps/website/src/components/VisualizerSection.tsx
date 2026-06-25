import React, { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      <section className="w-full bg-brand-alt min-h-[500px] animate-pulse flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-slate-200" />
        <div className="w-full md:w-1/2 p-8 md:p-16 lg:p-24 space-y-6">
          <div className="h-4 bg-slate-200 w-32 mx-auto md:mx-0 rounded" />
          <div className="h-10 bg-slate-200 w-3/4 rounded" />
          <div className="h-10 bg-slate-200 w-1/2 rounded" />
          <div className="h-24 bg-slate-200 w-full rounded" />
        </div>
      </section>
    );
  }

  const content = data || DEFAULT_DATA;
  const ctaUrl = content.cta_link || import.meta.env.VITE_APP_URL || '/login';
  
  return (
    <section className="w-full bg-brand-alt flex flex-col md:flex-row">
      {/* Left Panel: Media */}
      <div className="w-full md:w-1/2 relative aspect-square md:aspect-auto min-h-[300px] md:min-h-full">
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
          <div className="absolute inset-0 w-full h-full bg-brand-alt/50 flex flex-col items-center justify-center border border-white/20">
            <ImageIcon className="w-12 h-12 text-brand-muted/50 mb-2" />
            <p className="text-sm text-brand-muted/70">No media uploaded</p>
          </div>
        )}
      </div>

      {/* Right Panel: Content */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 py-12 md:py-24">
        
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
                <span className="font-serif text-brand-accent italic min-w-[24px]">0{idx + 1}</span>
                <span className="font-sans text-brand-text">{bullet}</span>
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
    </section>
  );
}
