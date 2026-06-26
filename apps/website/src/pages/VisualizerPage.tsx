import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { ArrowLeft, Upload, LayoutDashboard, Wand2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/AuthModal';

export default function VisualizerPage() {
  const navigate = useNavigate();
  const { isAuthenticated, favoriteFabrics } = useCustomerAuth();
  const [authModalOpen, setAuthModalOpen] = useState(!isAuthenticated);
  
  const [step, setStep] = useState(1);
  const [selectedFabric, setSelectedFabric] = useState<any>(null);
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [localRoomImage, setLocalRoomImage] = useState<string | null>(null);
  
  const [isRendering, setIsRendering] = useState(false);
  const [renderedImage, setRenderedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
    } else {
      setAuthModalOpen(false);
    }
  }, [isAuthenticated]);

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
      setSelectedRoom({ id: 'local', name: 'Custom Room', image_url: url });
    }
  };

  const handleRender = () => {
    if (!selectedFabric || !selectedRoom) return;
    setIsRendering(true);
    setStep(3);
    
    // Mock rendering delay
    setTimeout(() => {
      setIsRendering(false);
      setRenderedImage(selectedRoom.image_url); // In a real app, this would be the rendered image output
    }, 2500);
  };

  const reset = () => {
    setStep(1);
    setSelectedFabric(null);
    setSelectedRoom(null);
    setLocalRoomImage(null);
    setRenderedImage(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center">
        <AuthModal isOpen={authModalOpen} onClose={() => {
          setAuthModalOpen(false);
          navigate('/');
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col font-sans">
      {/* Header */}
      <header className="flex-none h-16 border-b border-white/10 bg-brand-dark/95 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="font-serif text-xl font-bold tracking-widest text-white">AI VISUALIZER</div>
        </div>
        
        {/* Stepper */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
          <div className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-brand-terracotta text-white' : 'text-brand-muted'}`}>1. Fabric</div>
          <div className="w-8 h-px bg-white/20"></div>
          <div className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-brand-terracotta text-white' : 'text-brand-muted'}`}>2. Room</div>
          <div className="w-8 h-px bg-white/20"></div>
          <div className={`px-3 py-1 rounded-full ${step >= 3 ? 'bg-brand-terracotta text-white' : 'text-brand-muted'}`}>3. Render</div>
        </div>

        <div className="w-20" /> {/* Spacer for centering */}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        
        {/* Step 3: Render Result */}
        {step === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            {isRendering ? (
              <div className="flex flex-col items-center gap-4 text-brand-terracotta">
                <Wand2 size={48} className="animate-pulse" />
                <Loader2 size={24} className="animate-spin text-brand-muted" />
                <div className="text-xl font-bold animate-pulse text-white mt-2">AI is weaving your fabric...</div>
                <p className="text-brand-muted text-sm">Applying {selectedFabric?.title} to the selected room.</p>
              </div>
            ) : (
              <div className="w-full max-w-5xl flex flex-col items-center animate-in fade-in zoom-in duration-500">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                  <img src={renderedImage!} alt="Rendered Room" className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <div>
                      <h3 className="text-white font-bold text-2xl">{selectedFabric?.title}</h3>
                      <p className="text-brand-muted text-sm">{selectedFabric?.code}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  <Button onClick={() => setStep(2)} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Change Room
                  </Button>
                  <Button onClick={reset} className="bg-brand-terracotta hover:bg-[#c95841] text-white">
                    Start New Project
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Room Selection */}
        {step <= 2 && (
          <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-48 transition-all duration-500 ${step === 1 ? 'opacity-50 pointer-events-none scale-[0.98]' : 'opacity-100 scale-100'}`}>
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Choose a Sample Room</h2>
                  <p className="text-brand-muted text-sm mt-1">Select a predefined room or upload your own image</p>
                </div>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleLocalImageUpload} />
                <Button onClick={() => fileInputRef.current?.click()} className="bg-white text-black hover:bg-slate-200">
                  <Upload className="mr-2 h-4 w-4" /> Choose from Gallery
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {localRoomImage && (
                  <div 
                    className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${selectedRoom?.id === 'local' ? 'border-brand-terracotta shadow-[0_0_15px_rgba(224,103,79,0.3)]' : 'border-transparent hover:border-white/20'}`}
                    onClick={() => setSelectedRoom({ id: 'local', name: 'Custom Room', image_url: localRoomImage })}
                  >
                    <div className="aspect-[4/3] bg-slate-800 relative">
                      <img src={localRoomImage} alt="Custom Room" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 text-white font-bold">Custom Room</div>
                    </div>
                  </div>
                )}
                {rooms.map(room => {
                  const imageUrl = room.image_url.startsWith('http') ? room.image_url : `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${room.image_url}`;
                  return (
                    <div 
                      key={room.id}
                      className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${selectedRoom?.id === room.id ? 'border-brand-terracotta shadow-[0_0_15px_rgba(224,103,79,0.3)]' : 'border-transparent hover:border-white/20'}`}
                      onClick={() => setSelectedRoom(room)}
                    >
                      <div className="aspect-[4/3] bg-slate-800 relative">
                        <img src={imageUrl} alt={room.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                        <div className="absolute bottom-4 left-4 text-white font-bold">{room.name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Step 1 & Bottom Action Bar (Fabric Selection) */}
        {step <= 2 && (
          <div className="fixed bottom-0 inset-x-0 z-30 bg-brand-dark/95 backdrop-blur-xl border-t border-white/10 pt-4 pb-6 px-4 md:px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-end">
              
              {/* Fabric Strip */}
              <div className="flex-1 w-full overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-sm tracking-widest uppercase">
                    {step === 1 ? '1. Choose your Fabric' : 'Selected Fabric'}
                  </h3>
                  {step === 2 && (
                    <button onClick={() => setStep(1)} className="text-brand-muted text-xs hover:text-white underline">Change</button>
                  )}
                </div>
                
                {favoriteFabrics.length === 0 ? (
                  <div className="h-24 md:h-32 flex flex-col items-center justify-center border border-dashed border-white/20 rounded-xl bg-white/5">
                    <p className="text-brand-muted text-sm mb-2">No favorites found.</p>
                    <Button onClick={() => navigate('/favorites')} variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                      Go to Favorites
                    </Button>
                  </div>
                ) : (
                  <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar snap-x">
                    {favoriteFabrics.map((fav: any) => (
                      <div 
                        key={fav.id}
                        onClick={() => { setSelectedFabric(fav); setStep(2); }}
                        className={`flex-none w-24 md:w-32 cursor-pointer transition-all snap-start rounded-lg overflow-hidden border-2 ${selectedFabric?.id === fav.id ? 'border-brand-terracotta shadow-[0_0_10px_rgba(224,103,79,0.3)]' : 'border-transparent hover:border-white/20'}`}
                      >
                        <div className="aspect-square bg-slate-800 relative">
                          <img src={fav.image_url} alt={fav.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/80 backdrop-blur-sm">
                            <p className="text-[9px] md:text-[10px] text-white font-bold truncate leading-none">{fav.title}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Render CTA */}
              <div className="w-full md:w-auto flex-none pb-2">
                <Button 
                  onClick={handleRender} 
                  disabled={!selectedFabric || !selectedRoom}
                  className="w-full md:w-64 h-14 bg-brand-terracotta hover:bg-[#c95841] text-white text-lg font-bold tracking-wider rounded-xl shadow-[0_0_20px_rgba(224,103,79,0.2)] disabled:opacity-50 disabled:shadow-none"
                >
                  <Wand2 className="mr-2 h-5 w-5" /> RENDER
                </Button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
