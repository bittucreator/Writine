'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FloatingNav } from '@/components/FloatingNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Check, 
  Loader2,
  Sparkles,
  Zap,
  CreditCard,
  Receipt,
  Calendar,
  Download,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  icon: React.ElementType;
  popular?: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
}

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
    icon: Sparkles,
    popular: true,
  },
];

// Mock invoices for demo - will be replaced with real Stripe data
const MOCK_INVOICES: Invoice[] = [
  { id: 'inv_001', date: '2024-12-01', amount: 20, status: 'paid' },
  { id: 'inv_002', date: '2024-11-01', amount: 20, status: 'paid' },
  { id: 'inv_003', date: '2024-10-01', amount: 20, status: 'paid' },
];

export default function BillingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro'>('free');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<{ last4: string; brand: string } | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchBillingInfo();
    }
  }, [user]);

  const fetchBillingInfo = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // TODO: Fetch from Supabase/Stripe
      // For now, simulate loading and check user's subscription status
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data - replace with real API call
      // Uncomment below to test Pro view:
      // setCurrentPlan('pro');
      // setSubscriptionEndDate('2025-01-22');
      // setPaymentMethod({ last4: '4242', brand: 'Visa' });
      // setInvoices(MOCK_INVOICES);
    } catch (error) {
      console.error('Error fetching billing info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    // TODO: Implement Stripe checkout
    console.log('Selected plan:', planId);
    alert(`Plan upgrade coming soon! Selected: ${planId}`);
  };

  const handleManageSubscription = () => {
    // TODO: Redirect to Stripe Customer Portal
    alert('Stripe Customer Portal coming soon!');
  };

  const handleUpdatePaymentMethod = () => {
    // TODO: Open Stripe payment method update
    alert('Update payment method coming soon!');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#918df6]" />
      </div>
    );
  }

  // Pro user view
  const renderProBilling = () => (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Current Plan</CardTitle>
            <Badge className="bg-[#918df6]">Pro</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#918df6]/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#918df6]" />
            </div>
            <div>
              <p className="font-semibold text-lg">Pro Plan</p>
              <p className="text-sm text-muted-foreground">$20/month • Unlimited access</p>
            </div>
          </div>
          
          {subscriptionEndDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Next billing date: {formatDate(subscriptionEndDate)}</span>
            </div>
          )}

          <Separator />

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleManageSubscription}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Manage Subscription
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              Cancel Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentMethod ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium">{paymentMethod.brand} •••• {paymentMethod.last4}</p>
                  <p className="text-sm text-muted-foreground">Expires 12/25</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleUpdatePaymentMethod}>
                Update
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">No payment method on file</p>
                <p className="text-xs text-amber-600">Add a payment method to continue your subscription</p>
              </div>
              <Button size="sm" className="bg-[#918df6] hover:bg-[#7b77e0]" onClick={handleUpdatePaymentMethod}>
                Add Card
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice History Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{formatDate(invoice.date)}</p>
                      <p className="text-xs text-muted-foreground">Pro Plan</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">${invoice.amount.toFixed(2)}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          invoice.status === 'paid' 
                            ? 'text-green-600 border-green-200 bg-green-50' 
                            : invoice.status === 'pending'
                            ? 'text-amber-600 border-amber-200 bg-amber-50'
                            : 'text-red-600 border-red-200 bg-red-50'
                        }`}
                      >
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No invoices yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Free user view - show plans
  const renderFreeBilling = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {PLANS.map((plan) => (
        <Card
          key={plan.id}
          className={`relative transition-all hover:border-[#918df6] ${
            plan.popular ? 'border-[#918df6] ring-1 ring-[#918df6]' : ''
          }`}
        >
          {plan.popular && (
            <Badge className="absolute -top-2 right-4 bg-[#918df6]">
              Recommended
            </Badge>
          )}
          
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#918df6]/10 flex items-center justify-center">
                <plan.icon className="w-5 h-5 text-[#918df6]" />
              </div>
              <div>
                <h4 className="font-semibold">{plan.name}</h4>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
            </div>

            <div className="mb-6">
              {plan.price === 0 ? (
                <p className="text-3xl font-bold">Free</p>
              ) : (
                <p className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-base font-normal text-muted-foreground">/mo</span>
                </p>
              )}
            </div>

            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              variant={currentPlan === plan.id ? 'outline' : 'default'}
              className={`w-full ${currentPlan !== plan.id ? 'bg-[#918df6] hover:bg-[#7b77e0]' : ''}`}
              onClick={() => handleSelectPlan(plan.id)}
              disabled={currentPlan === plan.id}
            >
              {currentPlan === plan.id ? 'Current Plan' : plan.price === 0 ? 'Start Free Trial' : 'Upgrade to Pro'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <FloatingNav />
      <div className="flex flex-col items-center pt-16 px-6 pb-24">
        {/* Logo */}
        <div className="mb-10">
          <Image
            src="/writine-dark.svg"
            alt="Writine"
            width={32}
            height={32}
          />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">
            {currentPlan === 'pro' ? 'Billing & Subscription' : 'Billing & Plans'}
          </h2>
          <p className="text-muted-foreground">
            {currentPlan === 'pro' 
              ? 'Manage your subscription and payment details' 
              : 'Choose the plan that works best for you'}
          </p>
        </div>

        {/* Content */}
        <div className="w-full max-w-2xl">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
