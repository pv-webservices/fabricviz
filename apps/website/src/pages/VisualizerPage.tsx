import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { ArrowLeft, Upload, Wand2, Loader2, History, RotateCcw, Image as ImageIcon, Sofa, Blinds, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import AuthModal from '@/components/AuthModal';

export default function VisualizerPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, favoriteFabrics, favorites, clearAllFavorites } = useCustomerAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [browseModalOpen, setBrowseModalOpen] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  
  const [step, setStep] = useState(2); // 1 = Favorites, 2 = Room, 3 = Render
  const [selectedFabric, setSelectedFabric] = useState<any>(null);
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [localRoomImage, setLocalRoomImage] = useState<string | null>(null);
  
  const [isRendering, setIsRendering] = useState(false);
  const [renderedImage, setRenderedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setAuthModalOpen(true);
    } else if (isAuthenticated) {
      setAuthModalOpen(false);
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/rooms`);
        const json = await res.json();
        if (json.success) {
          setRooms(json.data.items || []);
        }
      } catch (err) {
        console.error('Failed to fetch rooms', err);
      }
    };
    fetchRooms();
  }, []);

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLocalRoomImage(url);
      const room = { id: 'local', name: 'Custom Room', image_url: url };
      setSelectedRoom(room);
      if (selectedFabric) {
        handleRender(room);
      }
    }
  };

  const handleRoomSelect = (room: any) => {
    setSelectedRoom(room);
    if (selectedFabric) {
      handleRender(room);
    }
  };

  const handleRender = (roomToRender = selectedRoom) => {
    setIsRendering(true);
    setStep(3);
    
    // Mock rendering delay
    setTimeout(() => {
      setIsRendering(false);
      setRenderedImage(roomToRender?.image_url);
    }, 2500);
  };

  const reset = () => {
    setStep(2);
    setSelectedFabric(null);
    setSelectedRoom(null);
    setLocalRoomImage(null);
    setRenderedImage(null);
    setShowRooms(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-brand-bg"><Loader2 className="animate-spin text-brand-muted" size={32} /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <AuthModal isOpen={authModalOpen} onClose={() => {
          setAuthModalOpen(false);
          navigate('/');
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[70px] md:pt-[92px] flex flex-col font-sans bg-brand-bg text-brand-text">
      <div className="flex-1 flex flex-col">
        
        {/* Top Header Actions (History, Start over) */}
        <div className="max-w-5xl mx-auto w-full px-4 pt-6 pb-2 flex justify-end gap-6 text-sm font-semibold text-brand-muted">
          <button className="flex items-center gap-2 hover:text-brand-text transition-colors">
            <History size={16} /> History <span className="bg-brand-terracotta text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">10</span>
          </button>
          <button onClick={reset} className="flex items-center gap-2 hover:text-brand-text transition-colors">
            <RotateCcw size={16} /> Start over
          </button>
        </div>

        {/* Stepper */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center bg-black/5 rounded-full p-1">
            <div 
              onClick={() => navigate('/favorites')}
              className={`px-4 md:px-6 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${step === 1 ? 'bg-brand-terracotta text-white' : 'text-brand-muted hover:text-brand-text'}`}
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-white text-brand-terracotta' : 'bg-black/20 text-brand-text'}`}>1</div>
              Favorites
            </div>
            <div className={`px-4 md:px-6 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors ${step === 2 ? 'bg-brand-terracotta text-white' : 'text-brand-muted hover:text-brand-text'}`}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-white text-brand-terracotta' : 'bg-black/20 text-brand-text'}`}>2</div>
              Room
            </div>
            <div className={`px-4 md:px-6 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors ${step === 3 ? 'bg-brand-terracotta text-white' : 'text-brand-muted hover:text-brand-text'}`}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-white text-brand-terracotta' : 'bg-black/20 text-brand-text'}`}>3</div>
              Render
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="max-w-5xl mx-auto w-full px-4 mb-2">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-brand-muted hover:text-brand-text transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        {/* Main Content Box */}
        <div className="flex-1 max-w-5xl mx-auto w-full px-4 pb-20">
          
          {step === 3 ? (
             <div className="flex-1 flex flex-col items-center justify-center py-20">
              {isRendering ? (
                <div className="flex flex-col items-center gap-4 text-brand-terracotta">
                  <Wand2 size={48} className="animate-pulse" />
                  <Loader2 size={24} className="animate-spin text-brand-muted" />
                  <div className="text-xl font-bold animate-pulse text-brand-text mt-2 font-serif tracking-wide">AI is weaving your fabric...</div>
                  <p className="text-brand-muted text-sm">Applying {selectedFabric?.title} to the selected room.</p>
                </div>
              ) : (
                <div className="w-full max-w-5xl flex flex-col items-center animate-in fade-in zoom-in duration-500">
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-black/5 group">
                    <img src={renderedImage!} alt="Rendered Room" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <div>
                        <h3 className="text-white font-bold text-2xl font-serif tracking-wide">{selectedFabric?.title}</h3>
                        <p className="text-white/80 text-sm uppercase tracking-wider">{selectedFabric?.code}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-8">
                    <Button onClick={() => setStep(2)} variant="outline" className="border-brand-text/20 text-brand-text hover:bg-black/5">
                      Change Room
                    </Button>
                    <Button onClick={reset} className="bg-brand-terracotta hover:bg-[#c95841] text-white">
                      Start New Project
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-black/5 p-6 md:p-10 shadow-xl">
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-brand-text mb-2 font-serif tracking-wide">Choose Your Room Photo</h1>
                <p className="text-brand-muted text-sm md:text-base">Pick a sample room, take a photo, or upload one from your gallery</p>
              </div>

              {/* Favorites Strip */}
              <div className="bg-brand-alt/30 rounded-xl border border-black/5 p-4 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-brand-terracotta">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    Your Favorites ({favorites.length}/20)
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <button 
                      onClick={() => setBrowseModalOpen(true)} 
                      className="text-brand-text px-3 py-1.5 border border-black/10 rounded hover:bg-black/5 transition-colors"
                    >
                      Browse more from catalog
                    </button>
                    <button onClick={() => navigate('/favorites')} className="text-brand-terracotta hover:text-brand-terracotta/80 transition-colors">Edit Favorites</button>
                    <button onClick={clearAllFavorites} className="text-brand-terracotta hover:text-brand-terracotta/80 transition-colors">Clear all</button>
                  </div>
                </div>

                {favoriteFabrics.length === 0 ? (
                  <div className="h-28 flex items-center justify-center border border-dashed border-black/10 rounded-lg bg-white/50">
                    <p className="text-brand-muted text-sm">No favorites found.</p>
                  </div>
                ) : (
                  <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar snap-x">
                    {favoriteFabrics.map((fav: any) => (
                      <div 
                        key={fav.id}
                        onClick={() => setSelectedFabric(fav)}
                        className={`flex-none w-20 md:w-24 cursor-pointer transition-all snap-start rounded-lg overflow-hidden border-2 ${selectedFabric?.id === fav.id ? 'border-brand-terracotta shadow-[0_0_10px_rgba(224,103,79,0.2)]' : 'border-transparent hover:border-black/10'}`}
                      >
                        <div className="aspect-square bg-brand-alt relative">
                          <img src={fav.image_url} alt={fav.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-white/90 backdrop-blur-sm text-center border-t border-black/5 flex flex-col items-center justify-center">
                            <p className="text-[9px] text-brand-text font-bold truncate w-full leading-tight">{fav.title}</p>
                            <p className="text-[7px] text-brand-muted uppercase tracking-widest truncate w-full mt-0.5 leading-none">{fav.code}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Room Selection Buttons */}
              <div className="space-y-6">
                <button 
                  onClick={() => setShowRooms(!showRooms)}
                  className={`w-full flex items-center gap-4 p-5 rounded-xl border transition-colors group text-left ${showRooms ? 'border-brand-terracotta shadow-[0_0_15px_rgba(224,103,79,0.1)] bg-brand-terracotta/5' : 'border-black/5 bg-brand-alt/20 hover:bg-brand-alt/50'}`}
                >
                  <div className="w-12 h-12 rounded-lg bg-brand-terracotta/10 text-brand-terracotta flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-brand-text font-bold text-lg font-serif">Choose Sample Room</h3>
                    <p className="text-brand-muted text-sm">Select from {rooms.length > 0 ? rooms.length : 15} pre-loaded rooms</p>
                  </div>
                </button>

                {showRooms && rooms.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in slide-in-from-top-4 fade-in duration-300">
                    {rooms.map(room => {
                      const imageUrl = room.image_url.startsWith('http') ? room.image_url : `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${room.image_url}`;
                      return (
                        <div 
                          key={room.id}
                          className="relative rounded-xl overflow-hidden cursor-pointer group border border-black/5"
                          onClick={() => handleRoomSelect(room)}
                        >
                          <div className="aspect-[4/3] bg-brand-alt relative">
                            <img src={imageUrl} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-100 transition-opacity"></div>
                            <div className="absolute bottom-3 inset-x-0 text-center text-white text-xs font-bold px-2 truncate tracking-wide">{room.name}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-black/10"></div>
                  <span className="flex-shrink-0 mx-4 text-brand-muted/50 text-[10px] font-bold tracking-widest uppercase">OR UPLOAD YOUR OWN</span>
                  <div className="flex-grow border-t border-black/10"></div>
                </div>

                <div className="relative overflow-hidden w-full flex items-center gap-4 p-5 rounded-xl border border-black/5 bg-brand-alt/20 hover:bg-brand-alt/50 transition-colors group text-left cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleLocalImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-12 h-12 rounded-lg bg-brand-terracotta/10 text-brand-terracotta flex items-center justify-center group-hover:scale-110 transition-transform relative z-0">
                    <Upload size={24} />
                  </div>
                  <div className="relative z-0">
                    <h3 className="text-brand-text font-bold text-lg font-serif">Choose from Gallery</h3>
                    <p className="text-brand-muted text-sm">Select existing photo</p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Browse More Modal */}
      <Modal isOpen={browseModalOpen} onClose={() => setBrowseModalOpen(false)} title="Browse Catalog" className="max-w-2xl bg-white border border-black/10 text-brand-text">
        <div className="grid grid-cols-2 gap-4 mt-4">
          {[
            { title: 'Sofa Fabrics', endUse: 'sofa', icon: <Sofa className="h-6 w-6" /> },
            { title: 'Curtain Fabrics', endUse: 'curtain', icon: <Blinds className="h-6 w-6" /> },
            { title: 'Rugs', endUse: 'rug', icon: <Grid className="h-6 w-6" /> },
            { title: 'Wallpaper', endUse: 'wallpaper', icon: <ImageIcon className="h-6 w-6" /> }
          ].map((cat) => (
            <div 
              key={cat.endUse}
              onClick={() => { setBrowseModalOpen(false); navigate(cat.endUse === 'sofa' || cat.endUse === 'curtain' ? `/${cat.endUse}` : `/category/${cat.endUse}`); }}
              className="group p-6 bg-brand-alt/20 hover:bg-brand-terracotta/5 border border-black/5 hover:border-brand-terracotta/30 rounded-xl cursor-pointer transition-all flex flex-col justify-between h-32"
            >
              <h3 className="font-bold text-lg text-brand-text group-hover:text-brand-terracotta transition-colors font-serif tracking-wide">{cat.title}</h3>
              <div className="self-end text-brand-muted/50 group-hover:text-brand-terracotta transform group-hover:scale-110 transition-all">
                {cat.icon}
              </div>
            </div>
          ))}
        </div>
      </Modal>

    </div>
  );
}
