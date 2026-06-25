import React from 'react';
import Hero from '../components/Hero';
import StatsBar from '../components/StatsBar';
import MasonryGrid from '../components/MasonryGrid';
import HomeTextilesCarousel from '../components/HomeTextilesCarousel';
import VisualizerSection from '../components/VisualizerSection';
import NewArrivals from '../components/NewArrivals';
import TestimonialsSection from '../components/TestimonialsSection';
import USPBand from '../components/USPBand';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <StatsBar />
      <MasonryGrid />
      <HomeTextilesCarousel />
      <VisualizerSection />
      <NewArrivals />
      <TestimonialsSection />
      <USPBand />
    </main>
  );
}
