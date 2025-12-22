'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import BlogEditorPro from '@/components/BlogEditorPro';
import { generateBlogContent, generateSEOMetadata, generateOutline } from '@/lib/ai';
import { analyzeSEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { FloatingNav } from '@/components/FloatingNav';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Globe,
  Eye,
  PanelRightClose,
  Copy,
  X,
  Briefcase,
  MessageCircle,
  BookOpen,
  Target,
  Smile,
  ScrollText,
  Trash2,
  GripVertical,
  Plus,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const TONES = [
  { id: 'professional', label: 'Professional', Icon: Briefcase },
  { id: 'conversational', label: 'Conversational', Icon: MessageCircle },
  { id: 'informative', label: 'Informative', Icon: BookOpen },
  { id: 'persuasive', label: 'Persuasive', Icon: Target },
  { id: 'friendly', label: 'Friendly', Icon: Smile },
  { id: 'formal', label: 'Formal', Icon: ScrollText },
];

const WORD_COUNTS = [
  { id: '500', label: 'Short (~500 words)' },
  { id: '1000', label: 'Medium (~1000 words)' },
  { id: '2000', label: 'Long (~2000 words)' },
  { id: '3000', label: 'Comprehensive (~3000 words)' },
];

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Spanish' },
  { id: 'fr', label: 'French' },
  { id: 'de', label: 'German' },
  { id: 'pt', label: 'Portuguese' },
  { id: 'it', label: 'Italian' },
  { id: 'hi', label: 'Hindi' },
];

type WizardStep = 'topic' | 'outline' | 'customize' | 'generate' | 'edit';

// Sortable Outline Item Component
function SortableOutlineItem({
  id,
  index,
  section,
  onUpdate,
  onDelete,
  canDelete,
}: {
  id: string;
  index: number;
  section: string;
  onUpdate: (value: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-2 p-3 border rounded-lg bg-white transition-all group
        ${isDragging ? 'shadow-lg border-[#918df6] scale-[1.02]' : 'hover:border-[#918df6]/50'}
      `}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 rounded hover:bg-slate-100"
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </button>
      
      {/* Section Number */}
      <Badge variant="secondary" className="shrink-0 bg-[#918df6]/10 text-[#918df6]">
        {index + 1}
      </Badge>
      
      {/* Section Input */}
      <Input
        type="text"
        value={section}
        onChange={(e) => onUpdate(e.target.value)}
        className="flex-1 border-0 focus-visible:ring-0 bg-transparent"
      />
      
      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
        disabled={!canDelete}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function BlogEditPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    }>
      <BlogEditPageContent />
    </Suspense>
  );
}

function BlogEditPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Get template params from URL
  const templateTopic = searchParams.get('topic');
  const templateKeywords = searchParams.get('keywords');
  const templateTone = searchParams.get('tone');
  const templateWordCount = searchParams.get('wordCount');

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>(id ? 'edit' : 'topic');
  const [topic, setTopic] = useState(templateTopic || '');
  const [keywords, setKeywords] = useState(templateKeywords || '');
  const [selectedTone, setSelectedTone] = useState(templateTone || 'professional');
  const [wordCount, setWordCount] = useState(templateWordCount || '1000');
  const [language, setLanguage] = useState('en');
  const [outline, setOutline] = useState<string[]>([]);
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [generationStep, setGenerationStep] = useState(0); // Track AI generation progress

  // Blog state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSidebar] = useState(true);

  const seoAnalysis = analyzeSEO(title, content, seoTitle, seoDescription, seoKeywords);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      if (id) {
        loadBlog();
      }
    }
  }, [id, user]);

  const loadBlog = async () => {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error loading blog:', error);
      return;
    }

    if (data) {
      setTitle(data.title);
      setContent(data.content);
      setExcerpt(data.excerpt);
      setSeoTitle(data.seo_title || '');
      setSeoDescription(data.seo_description || '');
      setSeoKeywords(data.seo_keywords || []);
    }
  };

  const handleGenerateOutline = async () => {
    if (!topic.trim()) return;

    setGeneratingOutline(true);
    try {
      const generatedOutline = await generateOutline(topic, keywords);
      setOutline(generatedOutline);
      setWizardStep('outline');
    } catch (error) {
      console.error('Error generating outline:', error);
      alert('Failed to generate outline. Please try again.');
    } finally {
      setGeneratingOutline(false);
    }
  };

  const handleGenerateContent = async () => {
    setGenerating(true);
    setGenerationStep(0);
    setWizardStep('generate');
    try {
      // Step 1: Analyzing
      setGenerationStep(1);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Step 2: Researching
      setGenerationStep(2);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const prompt = `Topic: ${topic}
Keywords: ${keywords}
Outline: ${outline.join(', ')}
Word count: approximately ${wordCount} words
Language: ${LANGUAGES.find(l => l.id === language)?.label || 'English'}`;

      // Step 3: Writing
      setGenerationStep(3);
      const generatedContent = await generateBlogContent(prompt, selectedTone);
      setContent(generatedContent);
      setTitle(topic);
      setExcerpt(topic.slice(0, 160));
      
      // Step 4: SEO Optimization
      setGenerationStep(4);
      try {
        const metadata = await generateSEOMetadata(generatedContent, topic);
        setSeoTitle(metadata.seoTitle);
        setSeoDescription(metadata.seoDescription);
        setSeoKeywords(metadata.keywords);
      } catch (e) {
        console.error('SEO generation failed', e);
      }
      
      // Step 5: Polishing
      setGenerationStep(5);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Save the blog and redirect to full editor
      const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const blogData = {
        user_id: user?.id,
        title: topic,
        slug,
        content: generatedContent,
        excerpt: topic.slice(0, 160),
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: seoKeywords,
        status: 'draft',
      };

      const { data: savedBlog, error: saveError } = await supabase
        .from('blogs')
        .insert(blogData)
        .select()
        .single();

      if (saveError) throw saveError;

      // Redirect to full-page editor
      router.push(`/blog/editor/${savedBlog.id}`);
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
      setWizardStep('customize');
    } finally {
      setGenerating(false);
    }
  };


  const addKeyword = () => {
    if (keywordInput.trim() && !seoKeywords.includes(keywordInput.trim())) {
      setSeoKeywords([...seoKeywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setSeoKeywords(seoKeywords.filter((k) => k !== keyword));
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    );
  }

  // Wizard Step Components
  const renderTopicStep = () => (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">What would you like to write about?</h2>
        <p className="text-muted-foreground">Enter your topic and optional keywords to get started</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blog Details</CardTitle>
          <CardDescription>Provide information about your blog post</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Blog Topic *</Label>
            <Input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., How to Build a Successful Startup in 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Target Keywords (optional)</Label>
            <Input
              id="keywords"
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., startup tips, business growth, entrepreneurship"
            />
            <p className="text-xs text-muted-foreground">Separate keywords with commas for better SEO</p>
          </div>

          <Button
            onClick={handleGenerateOutline}
            disabled={!topic.trim() || generatingOutline}
            className="w-full bg-[#918df6] hover:bg-[#7b77e0]"
          >
            {generatingOutline ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Generating Outline...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Outline
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderOutlineStep = () => {
    const deleteSection = (index: number) => {
      if (outline.length <= 1) return;
      setOutline(outline.filter((_, i) => i !== index));
    };

    const addSection = () => {
      setOutline([...outline, 'New Section']);
    };

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = outline.findIndex((_, i) => `section-${i}` === active.id);
        const newIndex = outline.findIndex((_, i) => `section-${i}` === over.id);
        setOutline(arrayMove(outline, oldIndex, newIndex));
      }
    };

    return (
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Review Your Outline</h2>
          <p className="text-muted-foreground">Drag to reorder or edit sections</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{topic}</CardTitle>
            <CardDescription>{keywords}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={outline.map((_, i) => `section-${i}`)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {outline.map((section, index) => (
                    <SortableOutlineItem
                      key={`section-${index}`}
                      id={`section-${index}`}
                      index={index}
                      section={section}
                      onUpdate={(value) => {
                        const newOutline = [...outline];
                        newOutline[index] = value;
                        setOutline(newOutline);
                      }}
                      onDelete={() => deleteSection(index)}
                      canDelete={outline.length > 1}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add Section Button */}
            <Button
              variant="outline"
              onClick={addSection}
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>

            <Separator />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setWizardStep('topic')}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={() => setWizardStep('customize')}
              className="flex-1 bg-[#918df6] hover:bg-[#7b77e0]"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    );
  };

  const renderCustomizeStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Customize Your Blog</h2>
        <p className="text-muted-foreground">Fine-tune the style and length of your content</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Settings</CardTitle>
          <CardDescription>Configure how your blog should be written</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tone Selection */}
          <div className="space-y-3">
            <Label>Writing Tone</Label>
            <div className="grid grid-cols-3 gap-2">
              {TONES.map((tone) => (
                <Button
                  key={tone.id}
                  variant={selectedTone === tone.id ? 'default' : 'outline'}
                  onClick={() => setSelectedTone(tone.id)}
                  className={selectedTone === tone.id ? 'bg-[#918df6] hover:bg-[#7b77e0]' : ''}
                >
                  <tone.Icon className="w-4 h-4 mr-2" />
                  {tone.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Word Count */}
          <div className="space-y-3">
            <Label>Content Length</Label>
            <div className="grid grid-cols-2 gap-2">
              {WORD_COUNTS.map((wc) => (
                <Button
                  key={wc.id}
                  variant={wordCount === wc.id ? 'default' : 'outline'}
                  onClick={() => setWordCount(wc.id)}
                  className={`h-auto py-3 ${wordCount === wc.id ? 'bg-[#918df6] hover:bg-[#7b77e0]' : ''}`}
                >
                  {wc.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <Globe className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.id} value={lang.id}>{lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setWizardStep('outline')}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleGenerateContent}
              disabled={generating}
              className="flex-1 bg-[#918df6] hover:bg-[#7b77e0]"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Blog
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGeneratingStep = () => {
    const steps = [
      { id: 1, label: 'Analyzing topic and keywords' },
      { id: 2, label: 'Researching content structure' },
      { id: 3, label: 'Writing content sections' },
      { id: 4, label: 'Optimizing for SEO' },
      { id: 5, label: 'Polishing and formatting' },
    ];

    const getStepStatus = (stepId: number) => {
      if (stepId < generationStep) return 'complete';
      if (stepId === generationStep) return 'active';
      return 'pending';
    };

    const progressPercent = Math.min((generationStep / 5) * 100, 100);

    return (
      <div className="max-w-lg mx-auto text-center py-8">
        {/* Progress Steps 1-2-3 - all completed */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((stepNum, index) => (
            <div key={stepNum} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-[#918df6] text-white">
                <CheckCircle className="w-4 h-4" />
              </div>
              {index < 2 && (
                <div className="w-12 h-0.5 rounded bg-[#918df6]" />
              )}
            </div>
          ))}
        </div>

        {/* Title with Gradient */}
        <h2 className="text-2xl font-bold mb-2 bg-linear-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Creating Your Blog Post
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          Our AI is crafting SEO-optimized content just for you...
        </p>

        {/* Progress Bar */}
        <div className="mb-8 px-4">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-linear-to-r from-[#918df6] to-[#7b77e0] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{Math.round(progressPercent)}% complete</p>
        </div>

        {/* Step Cards */}
        <div className="space-y-3 text-left">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            return (
              <div
                key={step.id}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
                  ${status === 'complete' ? 'bg-[#918df6]/5 border-[#918df6]/20' : ''}
                  ${status === 'active' ? 'bg-white border-[#918df6] shadow-md shadow-[#918df6]/10' : ''}
                  ${status === 'pending' ? 'bg-slate-50/50 border-slate-100 opacity-50' : ''}
                `}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.5s ease-out forwards'
                }}
              >
                {/* Step Icon */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center shrink-0
                  ${status === 'complete' ? 'bg-[#918df6] text-white' : ''}
                  ${status === 'active' ? 'bg-[#918df6] text-white' : ''}
                  ${status === 'pending' ? 'bg-slate-200 text-slate-400' : ''}
                `}>
                  {status === 'complete' && <CheckCircle className="w-4 h-4" />}
                  {status === 'active' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {status === 'pending' && <span className="text-xs font-medium">{step.id}</span>}
                </div>

                {/* Step Label */}
                <span className={`
                  text-sm font-medium flex-1
                  ${status === 'complete' ? 'text-slate-700' : ''}
                  ${status === 'active' ? 'text-slate-900' : ''}
                  ${status === 'pending' ? 'text-slate-400' : ''}
                `}>
                  {step.label}
                  {status === 'active' && (
                    <span className="inline-flex ml-1">
                      <span className="animate-pulse">.</span>
                      <span className="animate-pulse" style={{ animationDelay: '200ms' }}>.</span>
                      <span className="animate-pulse" style={{ animationDelay: '400ms' }}>.</span>
                    </span>
                  )}
                </span>

                {/* Status Badge */}
                {status === 'complete' && (
                  <Badge className="bg-[#918df6]/10 text-[#918df6] border-0 text-xs">Done</Badge>
                )}
                {status === 'active' && (
                  <Badge className="bg-[#918df6] text-white border-0 text-xs animate-pulse">In Progress</Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Fun Tip */}
        <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-slate-600">💡 Did you know?</span> Our AI analyzes thousands of top-performing articles to craft content that ranks.
          </p>
        </div>
      </div>
    );
  };

  const renderEditStep = () => (
    <div className="flex gap-6">
      {/* Main Editor Area */}
      <div className={`flex-1 space-y-4 transition-all ${showPreview ? 'max-w-[50%]' : ''}`}>
        {/* Title & Excerpt Card */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Blog Title"
                className="text-xl font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief excerpt for blog listings..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Editor Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="text-base">Content Editor</CardTitle>
                <Badge variant="secondary">
                  {content.split(/\s+/).filter(Boolean).length} words
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={showPreview ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showPreview ? 'Hide' : 'Preview'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setWizardStep('topic');
                    setOutline([]);
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <BlogEditorPro content={content} onChange={setContent} />
        </Card>
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <div className="w-1/2 space-y-4 sticky top-20 h-fit">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4 bg-linear-to-r from-[#918df6]/10 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#918df6]" />
                  <CardTitle className="text-base">Live Preview</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPreview(false)}
                >
                  <PanelRightClose className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="p-8 bg-white">
                <article className="max-w-none">
                  {/* Blog Header */}
                  <header className="mb-8 pb-6 border-b">
                    <h1 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">
                      {title || 'Your Blog Title'}
                    </h1>
                    {excerpt && (
                      <p className="text-lg text-slate-600 italic border-l-4 border-[#918df6] pl-4">
                        {excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
                      <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      <span>•</span>
                      <span>{Math.ceil((content?.split(' ').length || 0) / 200)} min read</span>
                    </div>
                  </header>
                  
                  {/* Blog Content */}
                  <div 
                    className="prose prose-slate prose-lg max-w-none
                      prose-headings:font-bold prose-headings:text-slate-900
                      prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                      prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                      prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
                      prose-ul:my-4 prose-ul:pl-6
                      prose-li:text-slate-700 prose-li:mb-2
                      prose-strong:text-slate-900
                      prose-blockquote:border-l-4 prose-blockquote:border-[#918df6] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600"
                    dangerouslySetInnerHTML={{ __html: content || '<p class="text-slate-400">Start writing to see the preview...</p>' }} 
                  />
                </article>
              </div>
            </ScrollArea>
          </Card>
        </div>
      )}

      {/* SEO Sidebar */}
      {!showPreview && showSidebar && (
        <div className="w-80 space-y-4 sticky top-20 h-fit">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">SEO Score</CardTitle>
                <Badge className={
                  seoAnalysis.score >= 80 ? 'bg-green-100 text-green-700' :
                  seoAnalysis.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }>
                  {seoAnalysis.score}/100
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress 
                value={seoAnalysis.score} 
                className="h-2"
              />

              {seoAnalysis.issues.length > 0 && (
                <div className="space-y-2">
                  {seoAnalysis.issues.slice(0, 3).map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}

              {seoAnalysis.suggestions.length > 0 && (
                <div className="space-y-2">
                  {seoAnalysis.suggestions.slice(0, 2).map((suggestion, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="SEO optimized title"
                />
                <p className={`text-xs ${seoTitle.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {seoTitle.length}/60
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoDescription">Meta Description</Label>
                <Textarea
                  id="seoDescription"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Brief description for search engines"
                  rows={3}
                />
                <p className={`text-xs ${seoDescription.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {seoDescription.length}/160
                </p>
              </div>

              <div className="space-y-2">
                <Label>Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="Add keyword"
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={addKeyword}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {seoKeywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="gap-1"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(content);
                  alert('Content copied to clipboard!');
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy HTML
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <FloatingNav />
      <div className="flex flex-col items-center pt-16 px-6 pb-24">
        {/* Logo */}
        {wizardStep !== 'edit' && (
          <div className="mb-10">
            <Image
              src="/writine-dark.svg"
              alt="Writine"
              width={32}
              height={32}
            />
          </div>
        )}

        {/* Progress Steps */}
        {wizardStep !== 'edit' && wizardStep !== 'generate' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {['topic', 'outline', 'customize'].map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  wizardStep === step
                    ? 'bg-[#918df6] text-white'
                    : ['topic', 'outline', 'customize'].indexOf(wizardStep) > index
                    ? 'bg-[#918df6] text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {['topic', 'outline', 'customize'].indexOf(wizardStep) > index ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 2 && (
                  <div className={`w-12 h-0.5 rounded ${
                    ['topic', 'outline', 'customize'].indexOf(wizardStep) > index
                      ? 'bg-[#918df6]'
                      : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="w-full max-w-xl">
          {wizardStep === 'topic' && renderTopicStep()}
          {wizardStep === 'outline' && renderOutlineStep()}
          {wizardStep === 'customize' && renderCustomizeStep()}
          {wizardStep === 'generate' && renderGeneratingStep()}
          {wizardStep === 'edit' && renderEditStep()}
        </div>
      </div>
    </div>
  );
}
