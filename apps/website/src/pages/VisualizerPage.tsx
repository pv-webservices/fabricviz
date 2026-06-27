import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import {
  ArrowLeft, Upload, Wand2, Loader2, History, RotateCcw,
  Image as ImageIcon, Sofa, Blinds, Grid, Bed, Square, Plus, Check,
  Zap, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import AuthModal from '@/components/AuthModal';
import { useToast } from '@/hooks/use-toast';

// ── Constants ────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const STYLE_AREAS = [
  { id: 'sofa_seat',    label: 'Sofa Seat',     category: 'sofa',      icon: Sofa },
  { id: 'sofa_back',    label: 'Sofa Back',     category: 'sofa',      icon: Sofa },
  { id: 'sofa_all',     label: 'Sofa All',      category: 'sofa',      icon: Sofa },
  { id: 'front_curtain',label: 'Front Curtain', category: 'curtain',   icon: Blinds },
  { id: 'back_curtain', label: 'Back Curtain',  category: 'curtain',   icon: Blinds },
  { id: 'headboard',    label: 'Headboard',     category: 'sofa',      icon: Bed },
  { id: 'cushion',      label: 'Cushion',       category: 'sofa',      icon: Square },
  { id: 'rug',          label: 'Rug',           category: 'rug',       icon: Grid },
  { id: 'floor',        label: 'Floor',         category: 'rug',       icon: Grid },
  { id: 'accent_wall',  label: 'Accent Wall',   category: 'wallpaper', icon: ImageIcon },
  { id: 'all_walls',    label: 'All Walls',     category: 'wallpaper', icon: ImageIcon },
] as const;

// ── Types ────────────────────────────────────────────────────────────────────

interface FavoriteFabric {
  id: string;
  title: string;
  image_url: string;
  collection_name: string;
  code: string;
  category: string;
}

interface AssignedFabric {
  fabricId: string;
  fabricName: string;
  fabricCode: string;
  image_url: string;
  fabricColorDescription: string;
  fabricTextureDescription: string;
  fabricImageUrl: string | null;
}

type ModelChoice = 'fast' | 'pro';
type RoomType = { id: string; name: string; image_url: string } | null;

// ── Component ────────────────────────────────────────────────────────────────

export default function VisualizerPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, loading, favoriteFabrics } = useCustomerAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showRooms, setShowRooms] = useState(false);

  const [step, setStep] = useState(1); // 1 = Room, 2 = Editor, 3 = Render

  const [rooms, setRooms] = useState<{ id: string; name: string; image_url: string }[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomType>(null);

  // Fabric assignment state — key is STYLE_AREAS id, value is assigned fabric
  const [assignments, setAssignments] = useState<Record<string, AssignedFabric | null>>({});
  const [activeArea, setActiveArea] = useState<string | null>(null);

  // Model selection
  const [selectedModel, setSelectedModel] = useState<ModelChoice>('fast');

  // Render state
  const [isRendering, setIsRendering] = useState(false);
  const [renderedImage, setRenderedImage] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Credits state — fetched from API
  const [credits, setCredits] = useState<number | null>(null);
  const [totalCredits, setTotalCredits] = useState<number | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setAuthModalOpen(true);
    } else if (isAuthenticated) {
      setAuthModalOpen(false);
    }
  }, [isAuthenticated, loading]);

  // ── Fetch rooms ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_URL}/api/rooms`);
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

  // ── Fetch credits ───────────────────────────────────────────────────────────

  const fetchCredits = useCallback(async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/customer/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        // credit_limit from access_code or from customer — handle both shapes
        const cl = json.data.credit_limit ?? json.data.credits_remaining ?? null;
        const tl = json.data.credit_total ?? json.data.credit_limit_total ?? null;
        if (cl !== null) setCredits(Number(cl));
        if (tl !== null) setTotalCredits(Number(tl));
      }
    } catch (err) {
      console.error('Failed to fetch credits', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCredits();
    }
  }, [isAuthenticated, fetchCredits]);

  // ── Cleanup polling on unmount ──────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────

  const assignedCount = Object.values(assignments).filter(Boolean).length;
  const activeAreaObj = STYLE_AREAS.find((a) => a.id === activeArea);

  // Filter favorites by category for the active area
  const filteredFavorites = activeAreaObj
    ? (favoriteFabrics as FavoriteFabric[]).filter((f) => {
        if (!f.category) return false;
        const cat = f.category.toLowerCase();
        const target = activeAreaObj.category.toLowerCase();

        if (cat === 'both' && (target === 'sofa' || target === 'curtain')) return true;
        if (target === 'curtain' && (cat.includes('curtain') || cat.includes('drapery') || cat.includes('blind'))) return true;
        if (target === 'sofa' && (cat.includes('sofa') || cat.includes('upholstery') || cat.includes('cushion') || cat.includes('headboard'))) return true;
        if (target === 'rug' && (cat.includes('rug') || cat.includes('floor') || cat.includes('carpet'))) return true;
        if (target === 'wallpaper' && (cat.includes('wallpaper') || cat.includes('wall'))) return true;

        return cat.includes(target) || target.includes(cat);
      })
    : [];

  // Render button label
  const renderButtonLabel =
    assignedCount === 0
      ? 'Assign a fabric to start'
      : assignedCount === 1
      ? 'Render 1 area · 1 credit'
      : `Render ${assignedCount} areas · 1 credit`;

  const isRenderDisabled =
    assignedCount === 0 || isRendering || credits === 0;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedRoom({ id: 'local', name: 'Custom Room', image_url: url });
      setStep(2);
    }
  };

  const handleRoomSelect = (room: { id: string; name: string; image_url: string }) => {
    setSelectedRoom(room);
    setStep(2);
  };

  const handleAssignFabric = (fabric: FavoriteFabric) => {
    if (activeArea) {
      setAssignments((prev) => ({
        ...prev,
        [activeArea]: {
          fabricId: fabric.id,
          fabricName: fabric.title,
          fabricCode: fabric.code,
          image_url: fabric.image_url,
          fabricColorDescription: '',
          fabricTextureDescription: '',
          fabricImageUrl: fabric.image_url,
        },
      }));
    }
    setActiveArea(null);
  };

  const handleUnassignArea = (areaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAssignments((prev) => ({ ...prev, [areaId]: null }));
  };

  // ── Polling ─────────────────────────────────────────────────────────────────

  const startPolling = useCallback(
    (jobId: string, creditsBefore: number) => {
      let retryCount = 0;
      const MAX_NETWORK_RETRIES = 3;

      pollingRef.current = setInterval(async () => {
        const token = localStorage.getItem('customer_token');
        try {
          const res = await fetch(`${API_URL}/api/renders/${jobId}/status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json();
          if (!json.success) return;

          const { jobStatus, afterUrl, errorMessage } = json.data;

          if (jobStatus === 'completed') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setIsRendering(false);
            setRenderedImage(afterUrl);
            // Re-fetch actual credits
            await fetchCredits();
          } else if (jobStatus === 'failed') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setIsRendering(false);
            setStep(2); // Go back to area assignment
            // Restore optimistic credit
            setCredits((prev) => (prev !== null ? prev + 1 : null));
            toast({
              title: 'Render Failed',
              description: errorMessage || 'The render job failed. Please try again.',
              variant: 'destructive',
            });
            await fetchCredits();
          }
          retryCount = 0; // reset on success
        } catch {
          retryCount += 1;
          if (retryCount >= MAX_NETWORK_RETRIES) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setIsRendering(false);
            setCredits(creditsBefore);
            toast({
              title: 'Connection Lost',
              description: 'Lost connection while waiting for render. Please check your result in History.',
              variant: 'destructive',
            });
          }
        }
      }, 3000);
    },
    [fetchCredits, toast],
  );

  // ── Render submission ────────────────────────────────────────────────────────

  const handleRender = async () => {
    // Pre-flight check a: nothing assigned (button is disabled, unreachable normally)
    if (assignedCount === 0) return;

    // Pre-flight check b: no credits
    if (credits !== null && credits < 1) {
      toast({
        title: 'No Credits Left',
        description: 'You have no credits left. Please purchase more credits to continue.',
        variant: 'destructive',
      });
      return;
    }

    // Pre-flight check c: no room selected
    if (!selectedRoom) {
      toast({
        title: 'No Room Selected',
        description: 'Please select a room or upload a photo first.',
        variant: 'destructive',
      });
      return;
    }

    const token = localStorage.getItem('customer_token');
    if (!token) return;

    // Build areaAssignments payload
    const areaAssignments = (Object.entries(assignments) as [string, AssignedFabric | null][])
      .filter(([, v]) => v !== null)
      .map(([areaKey, v]) => ({
        areaKey,
        fabricId: (v as AssignedFabric).fabricId,
        fabricName: (v as AssignedFabric).fabricName,
        fabricCode: (v as AssignedFabric).fabricCode,
        fabricColorDescription: (v as AssignedFabric).fabricColorDescription,
        fabricTextureDescription: (v as AssignedFabric).fabricTextureDescription,
        fabricImageUrl: (v as AssignedFabric).fabricImageUrl,
      }));

    const isLocalRoom = selectedRoom.id === 'local';
    const payload = {
      roomId: isLocalRoom ? undefined : selectedRoom.id,
      uploadedPhotoUrl: isLocalRoom ? selectedRoom.image_url : undefined,
      sourceType: isLocalRoom ? 'uploaded_photo' : 'predefined_room',
      model: selectedModel,
      areaAssignments,
    };

    // Optimistic credit decrement
    const creditsBefore = credits;
    setCredits((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
    setIsRendering(true);
    setStep(3);

    try {
      const res = await fetch(`${API_URL}/api/renders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setIsRendering(false);
        setCredits(creditsBefore);
        setStep(2);

        if (res.status === 400) {
          toast({ title: 'Validation Error', description: 'Please check your selection and try again.', variant: 'destructive' });
        } else if (res.status === 402) {
          toast({ title: 'Not Enough Credits', description: 'Not enough credits. Please top up to continue.', variant: 'destructive' });
        } else if (res.status === 404) {
          toast({ title: 'Not Found', description: 'Room or fabric not found. Please refresh and try again.', variant: 'destructive' });
        } else {
          toast({ title: 'Server Error', description: 'Render failed due to a server error. Please try again.', variant: 'destructive' });
        }
        return;
      }

      const jobId: string = json.data.jobId;
      setCurrentJobId(jobId);

      // Start polling for job status
      startPolling(jobId, creditsBefore);
    } catch {
      setIsRendering(false);
      setCredits(creditsBefore);
      setStep(2);
      toast({ title: 'Network Error', description: 'Could not reach the server. Please check your connection.', variant: 'destructive' });
    }
  };

  const reset = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setStep(1);
    setAssignments({});
    setSelectedRoom(null);
    setRenderedImage(null);
    setCurrentJobId(null);
    setShowRooms(false);
    setIsRendering(false);
  };

  // ── Auth guard UI ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <Loader2 className="animate-spin text-brand-muted" size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-alt">
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => {
            setAuthModalOpen(false);
            navigate('/');
          }}
        />
      </div>
    );
  }

  // ── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pt-[70px] md:pt-[92px] flex flex-col font-sans bg-[#f2ede4] text-brand-text">
      <div className="flex-1 flex flex-col">

        {/* Top Header Actions (History, Start over) */}
        <div className="max-w-5xl mx-auto w-full px-4 pt-6 pb-2 flex justify-end gap-6 text-sm font-semibold text-brand-muted">
          <button className="flex items-center gap-2 hover:text-brand-text transition-colors">
            <History size={16} /> History{' '}
            <span className="bg-brand-terracotta text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">10</span>
          </button>
          <button onClick={reset} className="flex items-center gap-2 hover:text-brand-text transition-colors">
            <RotateCcw size={16} /> Start over
          </button>
        </div>

        {/* Stepper */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center bg-black/5 rounded-full p-1">
            {[
              { n: 1, label: 'Room' },
              { n: 2, label: 'Assign Fabrics' },
              { n: 3, label: 'Render' },
            ].map(({ n, label }) => (
              <div
                key={n}
                onClick={() => (step > n ? setStep(n) : undefined)}
                className={`px-4 md:px-6 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-colors
                  ${step === n ? 'bg-brand-terracotta text-white' : 'text-brand-muted hover:text-brand-text cursor-pointer'}`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px]
                    ${step === n ? 'bg-white text-brand-terracotta' : 'bg-black/20 text-brand-text'}`}
                >
                  {n}
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <div className="max-w-5xl mx-auto w-full px-4 mb-2">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
            className="flex items-center gap-2 text-sm font-medium text-brand-muted hover:text-brand-text transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        {/* Main Content Box */}
        <div className="flex-1 max-w-5xl mx-auto w-full px-4 pb-20">

          {step === 3 ? (
            /* ── Step 3: Render result ───────────────────────────────────────── */
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              {isRendering ? (
                <div className="flex flex-col items-center gap-4 text-brand-terracotta">
                  <Wand2 size={48} className="animate-pulse" />
                  <Loader2 size={24} className="animate-spin text-brand-muted" />
                  <div className="text-xl font-bold animate-pulse text-brand-text mt-2 font-serif tracking-wide">
                    AI is weaving your fabric...
                  </div>
                  <p className="text-brand-muted text-sm">
                    Applying {assignedCount} fabric{assignedCount !== 1 ? 's' : ''} to the selected room.
                  </p>
                  <p className="text-brand-muted text-xs opacity-60">Using {selectedModel === 'pro' ? 'Nano Banana Pro' : 'Nano Banana 2.0'} model</p>
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
                    <Button onClick={reset} className="bg-brand-terracotta hover:opacity-90 text-white">
                      Start New Project
                    </Button>
                  </div>
                </div>
              )}
            </div>

          ) : step === 2 ? (
            /* ── Step 2: Assign fabrics ──────────────────────────────────────── */
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

                <div className="flex flex-wrap justify-center gap-4 md:gap-6 pb-4">
                  {STYLE_AREAS.map((area) => {
                    const isAssigned = !!assignments[area.id];
                    const fabric = assignments[area.id];
                    const Icon = area.icon;
                    return (
                      <div
                        key={area.id}
                        onClick={() => setActiveArea(area.id)}
                        className="flex flex-col items-center gap-2 cursor-pointer group w-[72px] p-[2px]"
                      >
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center relative transition-transform group-hover:scale-105
                            ${isAssigned
                              ? 'bg-brand-terracotta/10 border-2 border-brand-terracotta'
                              : 'bg-white border border-black/10 hover:border-black/30 shadow-sm'}`}
                        >
                          {isAssigned ? (
                            <img src={fabric!.image_url} alt={fabric!.fabricName} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Icon size={24} className="text-brand-muted group-hover:text-brand-text transition-colors" />
                          )}
                          {!isAssigned && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border border-black/10 flex items-center justify-center shadow-sm">
                              <Plus size={12} className="text-brand-terracotta" />
                            </div>
                          )}
                          {isAssigned && (
                            <div
                              className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-terracotta rounded-full border-2 border-white flex items-center justify-center shadow-sm cursor-pointer"
                              onClick={(e) => handleUnassignArea(area.id, e)}
                              title="Remove assignment"
                            >
                              <Check size={10} className="text-white stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] md:text-xs font-semibold text-brand-text text-center leading-tight whitespace-normal">
                          {area.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-center text-xs text-brand-muted mt-2">Tap any circle to pick a fabric from your favorites</p>
              </div>

              {/* Model Toggle + Bottom Action Bar */}
              <div className="bg-brand-bg rounded-xl border border-black/5 p-4 flex flex-col gap-4">
                {/* Model Toggle — Part 7 */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-brand-muted font-semibold uppercase tracking-wider">Render Quality</span>
                  <div className="flex w-full rounded-lg overflow-hidden border border-black/10 bg-brand-alt/30">
                    {/* Fast option */}
                    <button
                      id="model-toggle-fast"
                      onClick={() => setSelectedModel('fast')}
                      title="Nano Banana 2.0 — faster generation, great for previews"
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors min-h-[44px]
                        ${selectedModel === 'fast'
                          ? 'bg-brand-terracotta text-white'
                          : 'text-brand-muted hover:text-brand-text hover:bg-brand-alt/50'}`}
                    >
                      <Zap size={14} />
                      <span>Fast</span>
                      <span className={`text-[10px] font-normal ${selectedModel === 'fast' ? 'text-white/70' : 'text-brand-muted/60'}`}>
                        Nano Banana 2.0
                      </span>
                    </button>
                    {/* Pro option */}
                    <button
                      id="model-toggle-pro"
                      onClick={() => setSelectedModel('pro')}
                      title="Nano Banana Pro — highest quality, production renders"
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors min-h-[44px]
                        ${selectedModel === 'pro'
                          ? 'bg-brand-terracotta text-white'
                          : 'text-brand-muted hover:text-brand-text hover:bg-brand-alt/50'}`}
                    >
                      <Star size={14} />
                      <span>Pro</span>
                      <span className={`text-[10px] font-normal ${selectedModel === 'pro' ? 'text-white/70' : 'text-brand-muted/60'}`}>
                        Nano Banana Pro
                      </span>
                    </button>
                  </div>
                </div>

                {/* Credits + Render Button row */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-brand-muted text-xs font-semibold">
                    {credits !== null ? (
                      <>
                        <span className="text-brand-terracotta font-bold">{credits} of {totalCredits ?? credits} credits left</span>
                        {totalCredits !== null && credits !== null && (
                          <> - {totalCredits - credits} used</>
                        )}
                      </>
                    ) : (
                      <span className="text-brand-terracotta font-bold">Unlimited credits</span>
                    )}
                  </div>

                  <Button
                    id="render-submit-btn"
                    onClick={handleRender}
                    disabled={isRenderDisabled}
                    className={`w-full md:w-auto px-8 font-bold tracking-wider
                      ${isRenderDisabled
                        ? 'bg-black/5 text-black/40 cursor-not-allowed'
                        : 'bg-brand-terracotta hover:opacity-90 text-white'}`}
                  >
                    <Wand2 size={16} className="mr-2" />
                    {credits === 0 ? 'No credits left' : renderButtonLabel}
                  </Button>
                </div>
              </div>
            </div>

          ) : (
            /* ── Step 1: Choose room ─────────────────────────────────────────── */
            <div className="bg-white rounded-2xl border border-black/5 p-6 md:p-10 shadow-xl animate-in slide-in-from-left fade-in duration-300">
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold text-brand-text mb-2 font-serif tracking-wide">
                  Choose Your Room Photo
                </h1>
                <p className="text-brand-muted text-sm md:text-base">
                  Pick a sample room, take a photo, or upload one from your gallery
                </p>
              </div>

              {/* Room Selection Buttons */}
              <div className="space-y-6">
                <button
                  onClick={() => setShowRooms(!showRooms)}
                  className={`w-full flex items-center gap-4 p-5 rounded-xl border transition-colors group text-left
                    ${showRooms
                      ? 'border-brand-terracotta shadow-[0_0_15px_rgba(199,91,58,0.1)] bg-brand-terracotta/5'
                      : 'border-black/5 bg-brand-alt/20 hover:bg-brand-alt/50'}`}
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
                    {rooms.map((room) => {
                      const imageUrl = room.image_url.startsWith('http')
                        ? room.image_url
                        : `${API_URL}${room.image_url}`;
                      return (
                        <div
                          key={room.id}
                          className="relative rounded-xl overflow-hidden cursor-pointer group border border-black/5"
                          onClick={() => handleRoomSelect({ ...room, image_url: imageUrl })}
                        >
                          <div className="aspect-[4/3] bg-brand-alt relative">
                            <img
                              src={imageUrl}
                              alt={room.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                            <div className="absolute bottom-3 inset-x-0 text-center text-white text-xs font-bold px-2 truncate tracking-wide">
                              {room.name}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-black/10" />
                  <span className="flex-shrink-0 mx-4 text-brand-muted/50 text-[10px] font-bold tracking-widest uppercase">
                    OR UPLOAD YOUR OWN
                  </span>
                  <div className="flex-grow border-t border-black/10" />
                </div>

                <div className="relative overflow-hidden w-full flex items-center gap-4 p-5 rounded-xl border border-black/5 bg-brand-alt/20 hover:bg-brand-alt/50 transition-colors group text-left cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLocalImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
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
      <Modal
        isOpen={!!activeArea}
        onClose={() => setActiveArea(null)}
        title={`Choose a fabric for ${activeAreaObj?.label}`}
        className="max-w-3xl bg-white border border-black/10 text-brand-text"
      >
        <p className="text-sm text-brand-muted mb-6 -mt-2">Tap an item from your favorites to assign it.</p>

        {filteredFavorites.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-black/10 rounded-xl bg-brand-bg">
            <ImageIcon size={48} className="text-brand-muted mb-4 opacity-30" />
            <h3 className="font-bold text-lg mb-2">No matching favorites</h3>
            <p className="text-brand-muted text-sm max-w-sm mb-6">
              You don't have any favorite fabrics in the <strong>{activeAreaObj?.category}</strong> category yet.
            </p>
            <Button
              onClick={() => {
                setActiveArea(null);
                const cat = activeAreaObj?.category;
                navigate(cat === 'sofa' || cat === 'curtain' ? `/${cat}` : `/category/${cat}`);
              }}
              className="bg-brand-terracotta hover:opacity-90 text-white"
            >
              Browse {activeAreaObj?.category} fabrics
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 custom-scrollbar max-h-[60vh] overflow-y-auto pb-4 px-1">
            {filteredFavorites.map((fav) => (
              <div
                key={fav.id}
                onClick={() => handleAssignFabric(fav)}
                className="group relative bg-brand-bg rounded-xl overflow-hidden border border-black/5 hover:border-brand-terracotta hover:shadow-md cursor-pointer transition-all"
              >
                <div className="aspect-square relative overflow-hidden bg-brand-alt">
                  <img
                    src={fav.image_url}
                    alt={fav.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
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
