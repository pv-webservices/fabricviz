import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StatsBar from './components/StatsBar';
import MasonryGrid from './components/MasonryGrid';
import HomeTextilesCarousel from './components/HomeTextilesCarousel';
import FabricFinder from './components/FabricFinder';
import NewArrivals from './components/NewArrivals';
import DesignerCurated from './components/DesignerCurated';
import USPBand from './components/USPBand';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="w-full min-h-screen bg-brand-bg text-brand-text font-sans">
      <Navbar />
      
      <main>
        <Hero />
        <StatsBar />
        <MasonryGrid />
        <HomeTextilesCarousel />
        <FabricFinder />
        <NewArrivals />
        <DesignerCurated />
        <USPBand />
        <Contact />
      </main>

      <Footer />
    </div>
  );
}
