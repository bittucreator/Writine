'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FloatingNav } from '@/components/FloatingNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Loader2,
  Search,
  ArrowRight,
  Briefcase,
  Code,
  Heart,
  TrendingUp,
  Lightbulb,
  BookOpen,
  Megaphone,
  Users,
  Plane,
  Utensils,
  Dumbbell,
  Camera,
} from 'lucide-react';

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ElementType;
  topic: string;
  keywords: string;
  tone: string;
  wordCount: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'business', label: 'Business' },
  { id: 'technology', label: 'Technology' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'health', label: 'Health' },
];

const TEMPLATES: Template[] = [
  {
    id: '1',
    title: 'How-To Guide',
    description: 'Step-by-step tutorial that teaches readers how to accomplish a specific task',
    category: 'business',
    icon: BookOpen,
    topic: 'How to [Action] in [Timeframe]: A Complete Guide',
    keywords: 'tutorial, guide, step-by-step, beginners',
    tone: 'informative',
    wordCount: '2000',
  },
  {
    id: '2',
    title: 'Product Review',
    description: 'In-depth analysis and honest review of a product or service',
    category: 'technology',
    icon: TrendingUp,
    topic: '[Product Name] Review: Is It Worth Your Money in 2025?',
    keywords: 'review, comparison, pros and cons, honest opinion',
    tone: 'professional',
    wordCount: '1500',
  },
  {
    id: '3',
    title: 'Listicle',
    description: 'Engaging list-based article with actionable tips or resources',
    category: 'marketing',
    icon: Lightbulb,
    topic: '10 [Topic] Tips That Will [Benefit] Your [Audience]',
    keywords: 'tips, best practices, list, actionable',
    tone: 'conversational',
    wordCount: '1500',
  },
  {
    id: '4',
    title: 'Case Study',
    description: 'Real-world example showcasing success stories and results',
    category: 'business',
    icon: Briefcase,
    topic: 'How [Company/Person] Achieved [Result] Using [Method]',
    keywords: 'case study, success story, results, strategy',
    tone: 'professional',
    wordCount: '2000',
  },
  {
    id: '5',
    title: 'Comparison Post',
    description: 'Side-by-side comparison of products, services, or methods',
    category: 'technology',
    icon: Code,
    topic: '[Option A] vs [Option B]: Which One Is Right for You?',
    keywords: 'comparison, vs, difference, which is better',
    tone: 'informative',
    wordCount: '2000',
  },
  {
    id: '6',
    title: 'Ultimate Guide',
    description: 'Comprehensive resource covering everything about a topic',
    category: 'marketing',
    icon: Megaphone,
    topic: 'The Ultimate Guide to [Topic] for [Audience]',
    keywords: 'complete guide, everything you need to know, comprehensive',
    tone: 'informative',
    wordCount: '3000',
  },
  {
    id: '7',
    title: 'Personal Story',
    description: 'Authentic narrative sharing experiences and lessons learned',
    category: 'lifestyle',
    icon: Heart,
    topic: 'My Journey: How I [Achievement] and What I Learned',
    keywords: 'personal experience, story, lessons, journey',
    tone: 'conversational',
    wordCount: '1500',
  },
  {
    id: '8',
    title: 'Industry News',
    description: 'Analysis of latest trends and developments in your industry',
    category: 'business',
    icon: TrendingUp,
    topic: '[Industry] Trends in 2025: What You Need to Know',
    keywords: 'trends, news, industry update, predictions',
    tone: 'professional',
    wordCount: '1500',
  },
  {
    id: '9',
    title: 'Interview Post',
    description: 'Q&A format featuring insights from an expert or influencer',
    category: 'business',
    icon: Users,
    topic: 'Expert Interview: [Name] Shares Insights on [Topic]',
    keywords: 'interview, expert, insights, Q&A',
    tone: 'conversational',
    wordCount: '2000',
  },
  {
    id: '10',
    title: 'Travel Guide',
    description: 'Destination guide with tips, recommendations, and itineraries',
    category: 'lifestyle',
    icon: Plane,
    topic: 'Complete Guide to [Destination]: Best Things to Do in 2025',
    keywords: 'travel guide, destination, things to do, itinerary',
    tone: 'friendly',
    wordCount: '2000',
  },
  {
    id: '11',
    title: 'Recipe Post',
    description: 'Delicious recipe with ingredients, steps, and cooking tips',
    category: 'lifestyle',
    icon: Utensils,
    topic: 'How to Make [Dish Name]: Easy [Cuisine] Recipe',
    keywords: 'recipe, cooking, food, homemade',
    tone: 'friendly',
    wordCount: '1000',
  },
  {
    id: '12',
    title: 'Fitness Guide',
    description: 'Workout routines, fitness tips, and health advice',
    category: 'health',
    icon: Dumbbell,
    topic: '[Workout Type] for Beginners: Complete [Duration] Program',
    keywords: 'workout, fitness, exercise, health',
    tone: 'friendly',
    wordCount: '1500',
  },
  {
    id: '13',
    title: 'Photography Tips',
    description: 'Tips and techniques for better photography',
    category: 'lifestyle',
    icon: Camera,
    topic: '[Number] Photography Tips to Take Stunning [Type] Photos',
    keywords: 'photography, tips, camera, photos',
    tone: 'informative',
    wordCount: '1500',
  },
  {
    id: '14',
    title: 'Wellness Article',
    description: 'Mental health, self-care, and wellness advice',
    category: 'health',
    icon: Heart,
    topic: '[Number] Ways to [Wellness Goal] for Better Mental Health',
    keywords: 'wellness, mental health, self-care, mindfulness',
    tone: 'friendly',
    wordCount: '1500',
  },
  {
    id: '15',
    title: 'Startup Advice',
    description: 'Entrepreneurship tips and startup guidance',
    category: 'business',
    icon: Lightbulb,
    topic: 'How to [Startup Action]: A Guide for First-Time Founders',
    keywords: 'startup, entrepreneur, business, founder',
    tone: 'professional',
    wordCount: '2000',
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesSearch = 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: Template) => {
    // Navigate to blog/new with template data
    const params = new URLSearchParams({
      template: template.id,
      topic: template.topic,
      keywords: template.keywords,
      tone: template.tone,
      wordCount: template.wordCount,
    });
    router.push(`/blog/new?${params.toString()}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#918df6]" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

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
          <h2 className="text-2xl font-bold mb-2">Blog Templates</h2>
          <p className="text-muted-foreground">Start with a pre-made template to speed up your writing</p>
        </div>

        {/* Search and Filters */}
        <div className="w-full max-w-4xl mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? 'bg-[#918df6] hover:bg-[#7b77e0]' : ''}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="w-full max-w-4xl">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="group hover:border-[#918df6] transition-all cursor-pointer"
                  onClick={() => handleUseTemplate(template)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#918df6]/10 flex items-center justify-center shrink-0">
                        <template.icon className="w-5 h-5 text-[#918df6]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 group-hover:text-[#918df6] transition-colors">
                          {template.title}
                        </h3>
                        <Badge variant="outline" className="text-xs capitalize">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {template.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        ~{template.wordCount} words
                      </span>
                      <div className="flex items-center gap-1 text-xs text-[#918df6] opacity-0 group-hover:opacity-100 transition-opacity">
                        Use template
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No templates found matching your search</p>
              <Button 
                variant="link" 
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="text-[#918df6]"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
