'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { FloatingNav } from '@/components/FloatingNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Check, 
  Loader2,
  Flame,
  Zap,
  Calendar,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  PauseCircle,
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  icon: React.ElementType;
  popular?: boolean;
  polarProductId?: string;
}

interface Subscription {
  id: string;
  status: string;
  plan: string;
  current_period_end: string | null;
  polar_customer_id: string | null;
  payment_failure_count?: number;
  paused_at?: string | null;
}

const POLAR_PRO_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID || '';

const PLANS: Plan[] = [
  {
    id: 'pro',
    name: 'Pro',
    price: 20,
    description: '7-day free trial, then $20/month',
    features: [
      '7-day free trial with full access',
      'Unlimited blog generation',
      'Advanced AI models',
      'Full SEO optimization',
      'Custom domains',
      'Priority support',
      'Analytics dashboard',
    ],
    icon: Flame,
    popular: true,
    polarProductId: POLAR_PRO_PRODUCT_ID,
  },
];

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const checkoutId = searchParams.get('checkout_id');
    
    if (success === 'true' && checkoutId) {
      toast.success('Payment successful! Your Pro plan is now active.', {
        description: 'Thank you for upgrading to Writine Pro!',
      });
      router.replace('/billing');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await db.getOne<Subscription>('subscriptions', {
        filters: { user_id: user.id }
      });
      
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: Plan) => {
    if (!plan.polarProductId) {
      toast.error('Product not configured. Please contact support.');
      return;
    }

    setUpgrading(true);
    try {
      const checkoutUrl = `/api/checkout?products=${plan.polarProductId}&customerEmail=${encodeURIComponent(user?.email || '')}`;
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error starting checkout:', error);
      toast.error('Failed to start checkout. Please try again.');
      setUpgrading(false);
    }
  };

  const handleManageSubscription = () => {
    window.open('https://polar.sh/settings', '_blank');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const currentPlan = subscription?.status === 'active' ? 'pro' : subscription?.status === 'paused' ? 'paused' : 'free';

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#918df6]" />
      </div>
    );
  }

  const renderProBilling = () => (
    <div className="space-y-6">
      <div 
        className="flex items-center gap-3 p-5 bg-green-50 rounded-xl"
        style={{ border: '0.5px solid rgba(34, 197, 94, 0.3)' }}
      >
        <CheckCircle className="w-6 h-6 text-green-600" />
        <div>
          <p className="font-semibold text-green-800">You&apos;re on the Pro Plan!</p>
          <p className="text-sm text-green-600">Enjoy unlimited access to all features</p>
        </div>
      </div>

      <div 
        className="bg-white rounded-xl p-5"
        style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Current Plan</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManageSubscription}
              className="h-8 text-xs border-0 shadow-none"
              style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Manage on Polar
            </Button>
            <Badge className="bg-[#918df6]">Pro</Badge>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#918df6]/10 flex items-center justify-center">
              <Flame className="w-6 h-6 text-[#918df6]" />
            </div>
            <div>
              <p className="font-semibold text-lg text-slate-900">Pro Plan</p>
              <p className="text-sm text-slate-500">$20/month • Unlimited access</p>
            </div>
          </div>
          
          {subscription?.current_period_end && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>Next billing date: {formatDate(subscription.current_period_end)}</span>
            </div>
          )}
        </div>
      </div>

      <div 
        className="bg-white rounded-xl p-5"
        style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-4">What&apos;s Included</h3>
        <ul className="space-y-3">
          {PLANS.find(p => p.id === 'pro')?.features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3 text-sm text-slate-700">
              <Check className="w-5 h-5 text-green-500 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderPausedBilling = () => (
    <div className="space-y-6">
      <div 
        className="flex items-center gap-3 p-5 bg-red-50 rounded-xl"
        style={{ border: '0.5px solid rgba(239, 68, 68, 0.3)' }}
      >
        <PauseCircle className="w-6 h-6 text-red-600" />
        <div>
          <p className="font-semibold text-red-800">Your Account is Paused</p>
          <p className="text-sm text-red-600">Please update your payment method to continue using Writine</p>
        </div>
      </div>

      <div 
        className="bg-white rounded-xl p-5"
        style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Payment Issue</h3>
          <Badge variant="destructive">Paused</Badge>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            We were unable to process your payment after multiple attempts. Your account features are temporarily paused until payment is resolved.
          </p>
          
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-700 mb-2">What you need to do:</p>
            <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
              <li>Update your payment method on Polar</li>
              <li>Ensure your card has sufficient funds</li>
              <li>Your access will be restored automatically once payment succeeds</li>
            </ol>
          </div>
          
          <Button
            className="w-full bg-[#918df6] hover:bg-[#7b77e0]"
            onClick={handleManageSubscription}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Update Payment Method
          </Button>
        </div>
      </div>

      <div 
        className="bg-white rounded-xl p-5"
        style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Pro Features (Currently Paused)</h3>
        <ul className="space-y-3 opacity-50">
          {PLANS.find(p => p.id === 'pro')?.features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3 text-sm text-slate-700">
              <Check className="w-5 h-5 text-slate-400 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center pt-4">
        <p className="text-xs text-slate-400">
          Need help? Contact support@writine.com
        </p>
      </div>
    </div>
  );

  const renderFreeBilling = () => (
    <div className="space-y-6">
      <div 
        className="flex items-center gap-3 p-5 bg-amber-50 rounded-xl"
        style={{ border: '0.5px solid rgba(245, 158, 11, 0.3)' }}
      >
        <AlertCircle className="w-6 h-6 text-amber-600" />
        <div>
          <p className="font-semibold text-amber-800">Get Started with Writine Pro</p>
          <p className="text-sm text-amber-600">Start your 7-day free trial with full access to all features</p>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className="relative bg-white rounded-xl p-6 transition-all"
            style={{ border: '1px solid rgba(145, 141, 246, 0.5)' }}
          >
            <Badge className="absolute -top-2 right-4 bg-[#918df6]">
              7-Day Free Trial
            </Badge>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#918df6]/10 flex items-center justify-center">
                <plan.icon className="w-5 h-5 text-[#918df6]" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">{plan.name}</h4>
                <p className="text-sm text-slate-500">{plan.description}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-3xl font-bold text-slate-900">
                ${plan.price}
                <span className="text-base font-normal text-slate-500">/mo</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">after 7-day free trial</p>
            </div>

            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full bg-[#918df6] hover:bg-[#7b77e0]"
              onClick={() => handleUpgrade(plan)}
              disabled={upgrading}
            >
              {upgrading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Start Free Trial'
              )}
            </Button>
          </div>
        ))}
      </div>

      <div className="text-center space-y-2 pt-4">
        <p className="text-sm text-slate-500">
          🔒 Secure payment powered by Polar
        </p>
        <p className="text-xs text-slate-400">
          Cancel anytime • No hidden fees • Instant access
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <FloatingNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            {currentPlan === 'pro' ? 'Billing & Subscription' : currentPlan === 'paused' ? 'Account Paused' : 'Billing & Plans'}
          </h1>
          <p className="text-sm text-slate-500">
            {currentPlan === 'pro' 
              ? 'Manage your subscription and payment details' 
              : currentPlan === 'paused'
              ? 'Update your payment method to restore access'
              : 'Choose the plan that works best for you'}
          </p>
        </div>

        <div className="w-full">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : currentPlan === 'pro' ? (
            renderProBilling()
          ) : currentPlan === 'paused' ? (
            renderPausedBilling()
          ) : (
            renderFreeBilling()
          )}
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#918df6]" />
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
