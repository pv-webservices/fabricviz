import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { ArrowLeft, Upload, Wand2, Loader2, History, RotateCcw, Image as ImageIcon, Sofa, Blinds, Grid, Bed, Square, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import AuthModal from '@/components/AuthModal';

const STYLE_AREAS = [
  { id: 'sofa_seat', label: 'Sofa Seat', category: 'sofa', icon: Sofa },
  { id: 'sofa_back', label: 'Sofa Back', category: 'sofa', icon: Sofa },
  { id: 'sofa_all', label: 'Sofa All', category: 'sofa', icon: Sofa },
  { id: 'front_curtain', label: 'Front Curtain', category: 'curtain', icon: Blinds },
  { id: 'back_curtain', label: 'Back Curtain', category: 'curtain', icon: Blinds },
  { id: 'headboard', label: 'Headboard', category: 'sofa', icon: Bed }, 
  { id: 'cushion', label: 'Cushion', category: 'sofa', icon: Square },
  { id: 'rug', label: 'Rug', category: 'rug', icon: Grid },
  { id: 'floor', label: 'Floor', category: 'rug', icon: Grid },
  { id: 'accent_wall', label: 'Accent Wall', category: 'wallpaper', icon: ImageIcon },
  { id: 'all_walls', label: 'All Walls', category: 'wallpaper', icon: ImageIcon },
];

export default function VisualizerPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, favoriteFabrics } = useCustomerAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  
  const [step, setStep] = useState(1); // 1 = Room, 2 = Editor, 3 = Render
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  
  // Fabric assignment state
  const [assignments, setAssignments] = useState<Record<string, any>>({});
  const [activeArea, setActiveArea] = useState<string | null>(null);
  
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
      const room = { id: 'local', name: 'Custom Room', image_url: url };
      setSelectedRoom(room);
      setStep(2); // Go to Editor
    }
  };

  const handleRoomSelect = (room: any) => {
    setSelectedRoom(room);
    setStep(2); // Go to Editor
  };

  const handleAssignFabric = (fabric: any) => {
    if (activeArea) {
      setAssignments(prev => ({ ...prev, [activeArea]: fabric }));
    }
    setActiveArea(null);
  };

  const handleRender = () => {
    if (Object.keys(assignments).length === 0) return; // Must have at least one assignment
    setIsRendering(true);
    setStep(3);
    
    // Mock rendering delay
    setTimeout(() => {
      setIsRendering(false);
      setRenderedImage(selectedRoom?.image_url);
    }, 2500);
  };

  const reset = () => {
    setStep(1);
    setAssignments({});
    setSelectedRoom(null);
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

  const assignedCount = Object.keys(assignments).length;
  const activeAreaObj = STYLE_AREAS.find(a => a.id === activeArea);
  // Filter favorites by the category of the active area (falling back to empty array if none)
  const filteredFavorites = activeAreaObj ? favoriteFabrics.filter((f: any) => f.category && f.category.toLowerCase() === activeAreaObj.category.toLowerCase()) : [];

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
              onClick={() => step > 1 ? setStep(1) : null}
              className={`px-4 md:px-6 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors ${step === 1 ? 'bg-brand-terracotta text-white' : 'text-brand-muted hover:text-brand-text cursor-pointer'}`}
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-white text-brand-terracotta' : 'bg-black/20 text-brand-text'}`}>1</div>
              Room
            </div>
            <div 
              onClick={() => step > 2 ? setStep(2) : null}
              className={`px-4 md:px-6 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors ${step === 2 ? 'bg-brand-terracotta text-white' : 'text-brand-muted hover:text-brand-text cursor-pointer'}`}
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-white text-brand-terracotta' : 'bg-black/20 text-brand-text'}`}>2</div>
              Assign Fabrics
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
                  <p className="text-brand-muted text-sm">Applying {assignedCount} fabric{assignedCount !== 1 ? 's' : ''} to the selected room.</p>
                </div>
              ) : (
                <div className="w-full max-w-5xl flex flex-col items-center animate-in fade-in zoom-in duration-500">
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-black/5 group">
                    <img src={renderedImage!} alt="Rendered Room" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <div>
                        <h3 className="text-white font-bold text-2xl font-serif tracking-wide">Render Complete</h3>
                        <p className="text-white/80 text-sm uppercase tracking-wider">{assignedCount} Area{assignedCount !== 1 ? 's' : ''} Assigned</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-8">
                    <Button onClick={() => setStep(2)} variant="outline" className="border-brand-text/20 text-brand-text hover:bg-black/5">
                      Edit Assignments
                    </Button>
                    <Button onClick={reset} className="bg-brand-terracotta hover:bg-[#c95841] text-white">
                      Start New Project
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : step === 2 ? (
            <div className="bg-white rounded-2xl border border-black/5 p-4 md:p-6 shadow-xl animate-in slide-in-from-right fade-in duration-300">
              {/* Top Room Banner */}
              <div className="w-full aspect-[16/9] md:aspect-[24/9] bg-brand-alt relative rounded-xl overflow-hidden mb-6 border border-black/5">
                <img src={selectedRoom?.image_url} alt="Room" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                   <Check size={14} className="text-green-400" /> Room Ready
                </div>
              </div>

              {/* Style Areas Section */}
              <div className="bg-brand-alt/20 border border-black/5 rounded-xl p-4 md:p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg font-serif">Style areas</h3>
                  <span className="text-xs text-brand-muted font-semibold">{assignedCount}/{STYLE_AREAS.length} assigned</span>
                </div>
                
                <div className="flex overflow-x-auto gap-4 md:gap-6 pb-4 custom-scrollbar snap-x">
                  {STYLE_AREAS.map(area => {
                    const isAssigned = !!assignments[area.id];
                    const fabric = assignments[area.id];
                    const Icon = area.icon;
                    return (
                      <div 
                        key={area.id} 
                        onClick={() => setActiveArea(area.id)}
                        className="flex flex-col items-center gap-2 cursor-pointer flex-none snap-start group w-[72px]"
                      >
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center relative transition-transform group-hover:scale-105 ${isAssigned ? 'bg-brand-terracotta/10 border-2 border-brand-terracotta' : 'bg-white border border-black/10 hover:border-black/30 shadow-sm'}`}>
                          {isAssigned ? (
                            <img src={fabric.image_url} alt={fabric.title} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Icon size={24} className="text-brand-muted group-hover:text-brand-text transition-colors" />
                          )}
                          {!isAssigned && (
                             <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border border-black/10 flex items-center justify-center shadow-sm">
                               <Plus size={12} className="text-brand-terracotta" />
                             </div>
                          )}
                          {isAssigned && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-terracotta rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                               <Check size={10} className="text-white stroke-[3]" />
                             </div>
                          )}
                        </div>
                        <span className="text-[10px] md:text-xs font-semibold text-brand-text text-center leading-tight whitespace-normal">{area.label}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-center text-xs text-brand-muted mt-2">Tap any circle to pick a fabric from your favorites</p>
              </div>

              {/* Bottom Action Bar */}
              <div className="bg-brand-bg rounded-xl border border-black/5 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-brand-muted text-xs font-semibold">
                  <span className="text-brand-terracotta font-bold">18 of 30 credits left</span> - 12 used
                </div>
                <Button 
                  onClick={handleRender} 
                  disabled={assignedCount === 0}
                  className={`w-full md:w-auto px-8 font-bold tracking-wider ${assignedCount > 0 ? 'bg-brand-terracotta hover:bg-[#c95841] text-white' : 'bg-black/5 text-black/40'}`}
                >
                  <Wand2 size={16} className="mr-2" />
                  {assignedCount > 0 ? 'RENDER SCENE' : 'Assign a fabric to start'}
                </Button>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-black/5 p-6 md:p-10 shadow-xl animate-in slide-in-from-left fade-in duration-300">
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-brand-text mb-2 font-serif tracking-wide">Choose Your Room Photo</h1>
                <p className="text-brand-muted text-sm md:text-base">Pick a sample room, take a photo, or upload one from your gallery</p>
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
                          onClick={() => handleRoomSelect({...room, image_url: imageUrl})}
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

      {/* Fabric Assignment Modal */}
      <Modal isOpen={!!activeArea} onClose={() => setActiveArea(null)} title={`Choose a fabric for ${activeAreaObj?.label}`} className="max-w-3xl bg-white border border-black/10 text-brand-text">
        <p className="text-sm text-brand-muted mb-6 -mt-2">Tap an item from your favorites to assign it.</p>
        
        {filteredFavorites.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-black/10 rounded-xl bg-brand-bg">
            <ImageIcon size={48} className="text-brand-muted mb-4 opacity-30" />
            <h3 className="font-bold text-lg mb-2">No matching favorites</h3>
            <p className="text-brand-muted text-sm max-w-sm mb-6">You don't have any favorite fabrics in the <strong>{activeAreaObj?.category}</strong> category yet.</p>
            <Button onClick={() => { setActiveArea(null); navigate(activeAreaObj?.category === 'sofa' || activeAreaObj?.category === 'curtain' ? `/${activeAreaObj.category}` : `/category/${activeAreaObj?.category}`); }} className="bg-brand-terracotta hover:bg-[#c95841] text-white">
              Browse {activeAreaObj?.category} fabrics
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 custom-scrollbar max-h-[60vh] overflow-y-auto pb-4 px-1">
            {filteredFavorites.map((fav: any) => (
              <div 
                key={fav.id}
                onClick={() => handleAssignFabric(fav)}
                className="group relative bg-brand-bg rounded-xl overflow-hidden border border-black/5 hover:border-brand-terracotta hover:shadow-md cursor-pointer transition-all"
              >
                <div className="aspect-square relative overflow-hidden bg-brand-alt">
                  <img src={fav.image_url} alt={fav.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-3 bg-white">
                  <h3 className="font-bold text-sm truncate">{fav.title}</h3>
                  <p className="text-[10px] text-brand-muted uppercase tracking-wider truncate">{fav.code}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

    </div>
  );
}
