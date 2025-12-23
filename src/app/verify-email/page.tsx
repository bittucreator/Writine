'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, RefreshCw, LogOut } from 'lucide-react';

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { user, isEmailConfirmed, signOut, resendConfirmationEmail } = useAuth();
  const router = useRouter();

  // If email is already confirmed, redirect to dashboard
  if (isEmailConfirmed) {
    router.push('/dashboard');
    return null;
  }

  const handleResend = async () => {
    setLoading(true);
    setError('');
    const { error } = await resendConfirmationEmail();
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-[#8345dd] rounded-xl flex items-center justify-center">
            <img src="/writine-light.svg" alt="Writine" className="w-6 h-6" />
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#8345dd]/10 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-[#8345dd]" />
              </div>
            </div>
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>
              Please verify your email to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center font-medium text-sm">{user?.email}</p>
            <p className="text-center text-sm text-muted-foreground">
              We sent a verification link to your email. Click the link to verify your account.
            </p>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-destructive text-sm text-center">{error}</p>
              </div>
            )}

            {sent && (
              <div className="p-3 rounded-md bg-green-50 border border-green-200">
                <p className="text-green-700 text-sm text-center">Verification email sent!</p>
              </div>
            )}

            <div className="pt-4 space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://gmail.com', '_blank')}
              >
                Open Gmail
              </Button>
              
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleResend}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Resend verification email
              </Button>

              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
