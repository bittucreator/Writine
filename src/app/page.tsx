'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sparkles,
  ArrowRight,
  Check,
  Globe,
  Search,
  PenTool,
  Layout,
  BarChart3,
  Github,
  Twitter,
  Play,
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
    name: 'Free Trial',
    price: '$0',
    period: '3 days',
    description: '3 days free trial',
    features: ['3 days free access', 'AI blog generation', 'Basic SEO tools', 'Standard support'],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$20',
    period: '/month',
    description: 'Unlimited access',
    features: ['Unlimited blog generation', 'Advanced AI models', 'Full SEO optimization', 'Custom domains', 'Priority support', 'Analytics dashboard'],
    cta: 'Upgrade to Pro',
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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`sticky top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl transition-transform duration-300 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#918df6] rounded-lg flex items-center justify-center">
              <Image src="/writine-light.svg" alt="Writine" width={20} height={20} />
            </div>
            <span className="font-semibold text-lg">Writine</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-[#918df6] hover:bg-[#7b77e0]">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-6 bg-[#918df6]/10 text-[#918df6] hover:bg-[#918df6]/20 border-0">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered Blog Writing
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Write blogs that
            <br />
            <span className="text-[#918df6]">rank & convert</span>
          </h1>

          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Create SEO-optimized blog content in minutes with AI. 
            From idea to published—all in one beautiful editor.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/signup">
              <Button size="lg" className="bg-[#918df6] hover:bg-[#7b77e0] h-12 px-8 text-base">
                Start Writing Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          <p className="text-sm text-slate-500 mb-16">
            No credit card required · Free plan available · Cancel anytime
          </p>

          {/* Hero Image/Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-linear-to-r from-[#918df6]/20 to-purple-300/20 rounded-2xl blur-3xl" />
            <div className="relative bg-white rounded-2xl border shadow-2xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white rounded-md px-4 py-1 text-xs text-slate-500 border">
                    writine.com/blog/new
                  </div>
                </div>
              </div>
              <div className="p-8 bg-linear-to-b from-white to-slate-50">
                <div className="flex gap-6">
                  {/* Sidebar Preview */}
                  <div className="hidden md:block w-48 space-y-3">
                    <div className="h-8 bg-slate-100 rounded-lg" />
                    <div className="h-6 bg-slate-100 rounded-lg w-3/4" />
                    <div className="h-6 bg-slate-100 rounded-lg w-1/2" />
                    <div className="h-32 bg-[#918df6]/10 rounded-lg border-2 border-dashed border-[#918df6]/30" />
                  </div>
                  {/* Editor Preview */}
                  <div className="flex-1 space-y-4">
                    <div className="h-10 bg-slate-100 rounded-lg w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-full" />
                    <div className="h-4 bg-slate-100 rounded w-5/6" />
                    <div className="h-4 bg-slate-100 rounded w-4/5" />
                    <div className="h-20 bg-[#918df6]/5 rounded-lg border-l-4 border-[#918df6] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-[#918df6]" />
                        <span className="text-sm text-[#918df6] font-medium">AI is generating...</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2 bg-[#918df6]/20 rounded w-full animate-pulse" />
                        <div className="h-2 bg-[#918df6]/20 rounded w-3/4 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#918df6]/10 text-[#918df6] border-0">Features</Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything you need to create amazing content
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Powerful AI tools combined with a beautiful writing experience. 
              No more switching between apps.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="bg-white border hover:shadow-lg transition-shadow group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-[#918df6]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#918df6] transition-colors">
                    <feature.icon className="w-6 h-6 text-[#918df6] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#918df6]/10 text-[#918df6] border-0">How It Works</Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              From idea to published in 3 steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Enter your topic', description: 'Tell us what you want to write about. Add keywords and select your preferred tone.' },
              { step: '2', title: 'Customize & generate', description: 'Review the AI-generated outline, make adjustments, and let AI write your blog.' },
              { step: '3', title: 'Edit & publish', description: 'Polish your content in our editor, optimize SEO, and publish to your domain.' },
            ].map((item, index) => (
              <div key={item.step} className="relative text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#918df6] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {item.step}
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute left-1/2 top-6 w-full h-0.5 bg-linear-to-r from-[#918df6] to-[#918df6]/20 -z-10" />
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
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#918df6]/10 text-[#918df6] border-0">Pricing</Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-slate-600">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {PRICING.map((plan) => (
              <Card key={plan.name} className={`relative ${plan.highlighted ? 'border-2 border-[#918df6] shadow-xl scale-105' : 'border'}`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#918df6] text-white">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-500">{plan.period}</span>
                  </div>
                  <p className="text-slate-600 mb-6">{plan.description}</p>
                  
                  <Link href="/signup">
                    <Button className={`w-full mb-6 ${plan.highlighted ? 'bg-[#918df6] hover:bg-[#7b77e0]' : ''}`} variant={plan.highlighted ? 'default' : 'outline'}>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-slate-900">
            Ready to write better content?
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Join thousands of content creators using Writine to produce 
            SEO-optimized blogs in minutes, not hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-[#918df6] text-white hover:bg-[#7d79e0] h-12 px-8">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="https://github.com/bittucreator/Writine" target="_blank">
              <Button size="lg" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 h-12 px-8">
                <Github className="w-5 h-5 mr-2" />
                Star on GitHub
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#918df6] rounded-lg flex items-center justify-center">
                <Image src="/writine-light.svg" alt="Writine" width={20} height={20} />
              </div>
              <span className="font-semibold">Writine</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-600">
              <Link href="#features" className="hover:text-slate-900">Features</Link>
              <Link href="#pricing" className="hover:text-slate-900">Pricing</Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="https://twitter.com" target="_blank" className="text-slate-400 hover:text-slate-600">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="https://github.com/bittucreator/Writine" target="_blank" className="text-slate-400 hover:text-slate-600">
                <Github className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 text-center text-sm text-slate-500">
            <p>© {new Date().getFullYear()} Writine.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
