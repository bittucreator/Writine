'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Set the session using the tokens from the hash
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            router.push('/login?error=auth_failed');
            return;
          }
        }

        // Also check for code parameter (PKCE flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code:', error);
            router.push('/login?error=auth_failed');
            return;
          }
        }

        // Ensure user profile exists
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const existingProfile = await db.getOne<{ id: string }>('user_profiles', {
            select: 'id',
            filters: { id: user.id }
          });
          
          if (!existingProfile) {
            // Create profile for new user
            await db.upsert('user_profiles', {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });
          }
        }

        // Redirect to dashboard
        router.push('/dashboard');
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=auth_failed');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8345dd] mx-auto mb-4" />
        <p className="text-slate-600">Signing you in...</p>
      </div>
    </div>
  );
}
