'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    // Check if there's an access_token in the hash (OAuth redirect)
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      // Redirect to auth callback page to handle the tokens
      router.push(`/auth/callback${window.location.hash}`);
    }
  }, [router]);

  return null;
}
