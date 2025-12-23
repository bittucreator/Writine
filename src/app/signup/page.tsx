'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [step, setStep] = useState<'email' | 'details' | 'confirmation'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { user, loading: authLoading, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 'email') {
      if (!email) {
        setError('Please enter your email');
        return;
      }
      setStep('details');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Show confirmation screen instead of redirecting
      setStep('confirmation');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
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

        {/* Confirmation Screen */}
        {step === 'confirmation' ? (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-[#8345dd]/10 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-[#8345dd]" />
                </div>
              </div>
              <CardTitle>Check your email</CardTitle>
              <CardDescription>
                We sent a verification link to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center font-medium text-sm">{email}</p>
              <p className="text-center text-sm text-muted-foreground">
                Click the link in your email to verify your account and get started.
              </p>
              <div className="pt-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open('https://gmail.com', '_blank')}
                >
                  Open Gmail
                </Button>
                <button
                  onClick={() => {
                    setStep('email');
                    setEmail('');
                    setPassword('');
                    setFullName('');
                  }}
                  className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Use a different email
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
        /* Card */
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Create an account</CardTitle>
            <CardDescription>Start creating AI-powered content today</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Form */}
            <form onSubmit={handleContinue} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-destructive text-sm text-center">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={step === 'details'}
                />
              </div>

              {step === 'details' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8345dd] hover:bg-[#7b77e0]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  step === 'email' ? 'Continue' : 'Create account'
                )}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={googleLoading}
              onClick={handleGoogleSignIn}
              className="w-full"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-[#8345dd] hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
