'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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
}

const POLAR_PRO_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID || '';

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free Trial',
    price: 0,
    description: '3 days free trial',
    features: [
      '3 days free access',
      'AI blog generation',
      'Basic SEO tools',
      'Standard support',
    ],
    icon: Zap,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 20,
    description: 'Unlimited access',
    features: [
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
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
      }
      
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

  const currentPlan = subscription?.status === 'active' ? 'pro' : 'free';

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

  const renderFreeBilling = () => (
    <div className="space-y-6">
      <div 
        className="flex items-center gap-3 p-5 bg-amber-50 rounded-xl"
        style={{ border: '0.5px solid rgba(245, 158, 11, 0.3)' }}
      >
        <AlertCircle className="w-6 h-6 text-amber-600" />
        <div>
          <p className="font-semibold text-amber-800">You&apos;re on the Free Trial</p>
          <p className="text-sm text-amber-600">Upgrade to Pro for unlimited access</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-xl p-5 transition-all ${
              plan.popular ? '' : 'hover:bg-slate-50/50'
            }`}
            style={{ 
              border: plan.popular 
                ? '1px solid rgba(145, 141, 246, 0.5)' 
                : '0.5px solid rgba(0, 0, 0, 0.08)' 
            }}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 right-4 bg-[#918df6]">
                Recommended
              </Badge>
            )}
            
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
              {plan.price === 0 ? (
                <p className="text-3xl font-bold text-slate-900">Free</p>
              ) : (
                <p className="text-3xl font-bold text-slate-900">
                  ${plan.price}
                  <span className="text-base font-normal text-slate-500">/mo</span>
                </p>
              )}
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
              variant={plan.id === 'free' ? 'outline' : 'default'}
              className={`w-full ${plan.id !== 'free' ? 'bg-[#918df6] hover:bg-[#7b77e0]' : ''}`}
              onClick={() => plan.id !== 'free' && handleUpgrade(plan)}
              disabled={plan.id === 'free' || upgrading}
            >
              {upgrading && plan.id !== 'free' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : plan.id === 'free' ? (
                'Current Plan'
              ) : (
                'Upgrade to Pro'
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
      <div className="max-w-4xl mx-auto px-6 py-8 pb-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            {currentPlan === 'pro' ? 'Billing & Subscription' : 'Billing & Plans'}
          </h1>
          <p className="text-sm text-slate-500">
            {currentPlan === 'pro' 
              ? 'Manage your subscription and payment details' 
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
