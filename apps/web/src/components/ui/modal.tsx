'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`bg-[#1e1e1e] border border-slate-800 rounded-xl shadow-lg w-full flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${className || 'max-w-lg'}`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-slate-500 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
