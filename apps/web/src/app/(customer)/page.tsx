'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Sofa, BoxSelect, QrCode, Grid } from 'lucide-react';

export default function CustomerHubPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-6 pb-4">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Choose Your Fabric</h2>
        <p className="text-base text-slate-500 mt-2">What would you like to visualize today?</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-2">
        <div className="grid grid-cols-1 gap-4">
          <Card className="border-0 shadow-sm ring-1 ring-slate-200 cursor-pointer active:scale-[0.98] transition-transform hover:ring-blue-500 hover:shadow-md" onClick={() => router.push('/collections?end_use=sofa')}>
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Sofa className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Sofa Collections</h3>
                  <p className="text-sm text-slate-500">Upholstery and heavy fabrics</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-slate-200 cursor-pointer active:scale-[0.98] transition-transform hover:ring-emerald-500 hover:shadow-md" onClick={() => router.push('/collections?end_use=curtain')}>
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <BoxSelect className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Curtain Collections</h3>
                  <p className="text-sm text-slate-500">Drapes and sheer fabrics</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-slate-200 cursor-pointer active:scale-[0.98] transition-transform hover:ring-purple-500 hover:shadow-md" onClick={() => router.push('/scan')}>
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <QrCode className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Scan QR Code</h3>
                  <p className="text-sm text-slate-500">Scan from physical swatches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-slate-200 cursor-pointer active:scale-[0.98] transition-transform hover:ring-slate-500 hover:shadow-md mt-4" onClick={() => router.push('/fabrics')}>
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <Grid className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">View All Fabrics</h3>
                  <p className="text-sm text-slate-500">Browse the entire catalog</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
