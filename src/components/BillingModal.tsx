'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface BillingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  icon: React.ElementType;
  popular?: boolean;
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

export function BillingModal({ open, onOpenChange }: BillingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentPlan] = useState('free');

  useEffect(() => {
    if (user && open) {
      fetchBillingInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, open]);

  const fetchBillingInfo = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch user's current plan status
      // For now, we'll just simulate loading
    } catch (error) {
      console.error('Error fetching billing info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    // TODO: Implement Stripe checkout
    console.log('Selected plan:', planId);
    toast.info(`Plan upgrade coming soon! Selected: ${planId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-162.5">
        <DialogHeader>
          <DialogTitle>Billing & Plans</DialogTitle>
          <DialogDescription>
            Choose the plan that works best for you
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="py-4">
            {/* Pricing Plans - Horizontal */}
            <div className="grid grid-cols-2 gap-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-white border rounded-2xl p-5 transition-all hover:border-[#918df6] ${
                    plan.popular ? 'border-[#918df6] ring-1 ring-[#918df6]' : ''
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 right-4 bg-[#918df6]">
                      Recommended
                    </Badge>
                  )}
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#918df6]/10 flex items-center justify-center">
                      <plan.icon className="w-4 h-4 text-[#918df6]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{plan.name}</h4>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    {plan.price === 0 ? (
                      <p className="text-2xl font-bold">Free</p>
                    ) : (
                      <p className="text-2xl font-bold">
                        ${plan.price}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                    )}
                  </div>

                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs">
                        <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={currentPlan === plan.id}
                  >
                    {currentPlan === plan.id ? 'Current Plan' : plan.price === 0 ? 'Start Free Trial' : 'Upgrade to Pro'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
