'use client';

import React, { useState, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { setAuthToken, setAuthUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await fetchApi<{ token: string; user: any }>('/api/auth/admin-login', {
        method: 'POST',
        requireAuth: false,
        body: JSON.stringify({ email, password }),
      });

      setAuthToken(data.token);
      setAuthUser(data.user);

      // Use hard navigation so the middleware picks up the freshly set cookie
      window.location.href = '/admin/dashboard';
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  }, [email, password]);

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  }, [handleLogin]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">FabricViz Admin</CardTitle>
          <CardDescription>Enter your email and password to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="javascript:void(0)" onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                name="email"
                type="email"
                placeholder="admin@fabricviz.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
