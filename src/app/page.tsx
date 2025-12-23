'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Check,
  Globe,
  Search,
  PenTool,
  Layout,
  BarChart3,
  Wand2,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Wand2,
    title: 'AI-Powered Writing',
    description: 'Generate high-quality blog posts with customizable tone, length, and style in seconds.',
  },
  {
    icon: PenTool,
    title: 'Rich Text Editor',
    description: 'Full-featured TipTap editor with slash commands, tables, code blocks, and more.',
  },
  {
    icon: Search,
    title: 'SEO Analysis',
    description: 'Real-time SEO scoring and actionable suggestions to rank higher on Google.',
  },
  {
    icon: Globe,
    title: 'Custom Domains',
    description: 'Publish blogs to your own domain with one-click SSL and CDN.',
  },
  {
    icon: Layout,
    title: 'Templates',
    description: 'Start with pre-built templates for tutorials, listicles, how-tos, and more.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Track views, engagement, and SEO performance for every blog post.',
  },
];

const PRICING = [
  {
    name: 'Pro',
    price: '$20',
    period: '/month',
    description: '7-day free trial, then $20/month',
    features: ['7-day free trial with full access', 'Unlimited blog generation', 'Advanced AI models', 'Full SEO optimization', 'Custom domains', 'Priority support', 'Analytics dashboard'],
    cta: 'Start Free Trial',
    highlighted: true,
  },
];

export default function LandingPage() {
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setHidden(currentScrollY > lastScrollY && currentScrollY > 60);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-[#f8f7f3] bg-grid">
      {/* Navigation */}
      <nav className={`sticky top-0 left-0 right-0 z-50 bg-[#f8f7f3]/80 backdrop-blur-xl transition-transform duration-300 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#8345dd] rounded-lg flex items-center justify-center">
              <Image src="/writine-light.svg" alt="Writine" width={20} height={20} />
            </div>
            <span className="font-semibold text-lg">Writine</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
            <Link href="/contact" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Contact</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="rounded-full">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-[#8345dd] hover:bg-[#7b77e0] rounded-full">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 sm:pt-24 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-4 sm:mb-6 bg-[#8345dd]/10 text-[#8345dd] hover:bg-[#8345dd]/20 border-0">
            From idea to published in minutes
          </Badge>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight tracking-tight">
            Write, publish, grow
            <br />
            your blog with AI
          </h1>

          <p className="text-base sm:text-xl text-slate-600 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
            Create SEO-optimized blog content in minutes. From idea to
            <br className="hidden md:block" />
            published—all in one beautiful editor.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12 px-4 sm:px-0">
            <Link href="/signup">
              <Button size="lg" className="bg-[#8345dd] hover:bg-[#7b77e0] h-12 px-8 text-base rounded-full w-full sm:w-auto">
                Start 7 Days Free Trial
              </Button>
            </Link>
          </div>

          {/* Hero Image/Preview */}
          <div className="max-w-5xl mx-auto">
            <div 
              className="bg-white rounded-2xl overflow-hidden" 
              style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}
            >
              <Image 
                src="/heroimage.png" 
                alt="Writine Dashboard" 
                width={1200} 
                height={800} 
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-4 bg-[#8345dd]/10 text-[#8345dd] border-0">Features</Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything you need to create amazing content
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
              Powerful AI tools combined with a beautiful writing experience. 
              No more switching between apps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map((feature) => (
              <div 
                key={feature.title} 
                className="bg-white rounded-xl p-6 transition-all hover:bg-slate-50/50 group"
                style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}
              >
                <div className="w-12 h-12 bg-[#8345dd]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#8345dd] transition-colors">
                  <feature.icon className="w-6 h-6 text-[#8345dd] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#f8f7f3]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-4 bg-[#8345dd]/10 text-[#8345dd] border-0">How It Works</Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-4">
              From idea to published in 3 steps
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Enter your topic', description: 'Tell us what you want to write about. Add keywords and select your preferred tone.' },
              { step: '2', title: 'Customize & generate', description: 'Review the AI-generated outline, make adjustments, and let AI write your blog.' },
              { step: '3', title: 'Edit & publish', description: 'Polish your content in our editor, optimize SEO, and publish to your domain.' },
            ].map((item, index) => (
              <div key={item.step} className="relative text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#8345dd] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {item.step}
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute left-1/2 top-6 w-full h-0.5 bg-linear-to-r from-[#8345dd] to-[#8345dd]/20 -z-10" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#f8f7f3]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-4 bg-[#8345dd]/10 text-[#8345dd] border-0">Pricing</Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="flex justify-center">
            {PRICING.map((plan) => (
              <div 
                key={plan.name} 
                className={`relative bg-white rounded-xl p-6 max-w-sm w-full ${plan.highlighted ? 'scale-105' : ''}`}
                style={{ border: plan.highlighted ? '2px solid #8345dd' : '0.5px solid rgba(0, 0, 0, 0.08)' }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#8345dd] text-white">Most Popular</Badge>
                  </div>
                )}
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
                <p className="text-slate-600 mb-6">{plan.description}</p>
                
                <Link href="/signup">
                  <Button className={`w-full mb-6 rounded-full ${plan.highlighted ? 'bg-[#8345dd] hover:bg-[#7b77e0]' : ''}`} variant={plan.highlighted ? 'default' : 'outline'}>
                    {plan.cta}
                  </Button>
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#f8f7f3]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-4 bg-[#8345dd]/10 text-[#8345dd] border-0">FAQ</Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-4">
              Frequently asked questions
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Everything you need to know about Writine
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {[
              {
                question: 'How does the AI blog generation work?',
                answer: 'Simply enter your topic, keywords, and preferred tone. Our AI analyzes top-performing content and generates a comprehensive, SEO-optimized blog post tailored to your specifications.',
              },
              {
                question: 'Can I edit the AI-generated content?',
                answer: 'Absolutely! All generated content is fully editable in our rich text editor. You can modify, add, or remove any section to match your voice and style.',
              },
              {
                question: 'What makes Writine different from other AI writers?',
                answer: 'Writine combines AI generation with real-time SEO analysis, custom domain publishing, and a beautiful editor—all in one platform. No need for multiple tools.',
              },
              {
                question: 'Is there a free trial?',
                answer: 'Yes! You get a 7-day free trial with full access to all Pro features. Add a payment method to start, and you\'ll only be charged after the trial ends. Cancel anytime.',
              },
              {
                question: 'Can I use my own domain?',
                answer: 'Yes, Pro users can connect custom domains. We handle SSL certificates and CDN automatically for fast, secure delivery.',
              },
              {
                question: 'How do I cancel my subscription?',
                answer: 'You can cancel anytime from your billing settings. Your access continues until the end of your billing period.',
              },
            ].map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white rounded-xl px-5 border-0"
                style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}
              >
                <AccordionTrigger className="text-slate-900 font-semibold hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-bold mb-4 text-slate-900">
            Ready to write better content?
          </h2>
          <p className="text-base sm:text-xl text-slate-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join thousands of content creators using Writine to produce 
            SEO-optimized blogs in minutes, not hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-[#8345dd] text-white hover:bg-[#7d79e0] h-12 px-8 rounded-full w-full sm:w-auto">
                Start 7 Days Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
