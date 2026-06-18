'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { setAuthToken, setAuthUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError('');
    
    if (code.length !== 5) {
      setError('Access code must be exactly 5 characters.');
      return;
    }

    setLoading(true);

    try {
      const data = await fetchApi<{ token: string; customer: any }>('/api/auth/verify-code', {
        method: 'POST',
        requireAuth: false,
        body: JSON.stringify({ code: code.toUpperCase() }),
      });

      setAuthToken(data.token);
      setAuthUser(data.customer);
      
      router.push('/fabrics');
    } catch (err: any) {
      setError(err.message || 'Invalid access code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-sm border-0 shadow-lg sm:border sm:shadow-sm">
        <CardHeader className="space-y-2 text-center pb-8 pt-6">
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">FabricViz</CardTitle>
          <CardDescription className="text-base">Enter your 5-digit access code</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Input
                id="code"
                type="text"
                placeholder="e.g. AB123"
                className="text-center text-2xl tracking-widest uppercase h-14 font-semibold"
                maxLength={5}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={loading}
              />
            </div>
            <Button type="submit" size="lg" className="w-full text-base h-12" disabled={loading || code.length !== 5}>
              {loading ? 'Verifying...' : 'Access Catalog'}
            </Button>
          </form>
          
          <div className="mt-8 text-center text-sm text-slate-500">
            Don't have a code? <a href="#" className="font-medium text-blue-600 hover:underline">Request one</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
