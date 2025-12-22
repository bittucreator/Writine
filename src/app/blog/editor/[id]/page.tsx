'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import BlogEditorPro from '@/components/BlogEditorPro';
import { PublishDialog } from '@/components/PublishDialog';
import { analyzeSEO, generateSlug } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit3,
  X,
  Sparkles,
  Settings,
  Copy,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BlogEditorPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Blog state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [domainId, setDomainId] = useState<string | null>(null);
  const [customSlug, setCustomSlug] = useState<string | null>(null);
  const [, setPublishedUrl] = useState<string | null>(null);
  const [blogStatus, setBlogStatus] = useState<'draft' | 'published'>('draft');
  
  // View state
  const [isPreview, setIsPreview] = useState(false);
  const [showSeoPanel, setShowSeoPanel] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const seoAnalysis = analyzeSEO(title, content, seoTitle, seoDescription, seoKeywords);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && id) {

      const loadBlog = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.error('Error loading blog:', error);
          setLoading(false);
          return;
        }

        if (data) {
          setTitle(data.title);
          setSlug(data.slug || '');
          setContent(data.content || '');
          setExcerpt(data.excerpt || '');
          setSeoTitle(data.seo_title || '');
          setSeoDescription(data.seo_description || '');
          setSeoKeywords(data.seo_keywords || []);
          setDomainId(data.domain_id || null);
          setCustomSlug(data.custom_slug || null);
          setPublishedUrl(data.published_url || null);
          setBlogStatus(data.status || 'draft');
        }
        setLoading(false);
      };

      loadBlog();
    }
  }, [id, user]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setSaving(true);
    try {
      const newSlug = generateSlug(title);
      const blogData = {
        user_id: user?.id,
        title,
        slug: newSlug,
        content,
        excerpt,
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: seoKeywords,
        readability_score: seoAnalysis.readabilityScore,
        seo_score: seoAnalysis.score,
      };

      const { error } = await supabase.from('blogs').update(blogData).eq('id', id);
      if (error) throw error;

      setSlug(newSlug);
      toast.success('Blog saved successfully!');
    } catch (error) {
      console.error('Error saving blog:', error);
      toast.error('Failed to save blog. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (publishData: { domainId: string | null; customSlug: string; publishedUrl: string }) => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setPublishing(true);
    try {
      const newSlug = generateSlug(title);
      const blogData = {
        user_id: user?.id,
        title,
        slug: newSlug,
        content,
        excerpt,
        seo_title: seoTitle,
        seo_description: seoDescription,
        seo_keywords: seoKeywords,
        readability_score: seoAnalysis.readabilityScore,
        seo_score: seoAnalysis.score,
        status: 'published',
        published_at: new Date().toISOString(),
        domain_id: publishData.domainId,
        custom_slug: publishData.customSlug,
        published_url: publishData.publishedUrl,
      };

      const { error } = await supabase.from('blogs').update(blogData).eq('id', id);
      if (error) throw error;

      setSlug(newSlug);
      setDomainId(publishData.domainId);
      setCustomSlug(publishData.customSlug);
      setPublishedUrl(publishData.publishedUrl);
      setBlogStatus('published');
      setShowPublishDialog(false);
      toast.success('Blog published successfully!');
    } catch (error) {
      console.error('Error publishing blog:', error);
      toast.error('Failed to publish blog. Please try again.');
    } finally {
      setPublishing(false);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  // Editor Mode
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
            <div className="w-px h-5 bg-slate-200" />
            <span className="text-sm font-medium text-slate-700 truncate max-w-50">
              {title || 'Untitled'}
            </span>
            {blogStatus === 'published' && !isPreview && (
              <Badge className="gap-1 bg-green-100 text-green-700 text-[10px]">
                <Globe className="w-3 h-3" />
                Published
              </Badge>
            )}
            {isPreview && (
              <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
                <Eye className="w-3 h-3" />
                Preview
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSeoPanel(!showSeoPanel)}
                className={showSeoPanel ? 'bg-slate-100' : ''}
              >
                <Settings className="w-4 h-4 mr-1.5" />
                SEO
                <Badge 
                  className={`ml-2 text-[10px] px-1.5 ${
                    seoAnalysis.score >= 80 ? 'bg-green-100 text-green-700' :
                    seoAnalysis.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}
                >
                  {seoAnalysis.score}
                </Badge>
              </Button>
            )}

            <Button
              variant={isPreview ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
              className={isPreview ? 'bg-[#918df6] hover:bg-[#7b77e0]' : ''}
            >
              {isPreview ? (
                <><Edit3 className="w-4 h-4 mr-1.5" />Edit</>
              ) : (
                <><Eye className="w-4 h-4 mr-1.5" />Preview</>
              )}
            </Button>

            <div className="w-px h-5 bg-slate-200" />

            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
              Save
            </Button>

            <Button
              size="sm"
              onClick={() => setShowPublishDialog(true)}
              disabled={saving || publishing}
              className="bg-[#918df6] hover:bg-[#7b77e0]"
            >
              {publishing ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-1.5" />Publishing...</>
              ) : (
                <><Globe className="w-4 h-4 mr-1.5" />{blogStatus === 'published' ? 'Update' : 'Publish'}</>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Publish Dialog */}
      <PublishDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
        blogId={id}
        blogTitle={title}
        blogSlug={slug || generateSlug(title)}
        currentDomainId={domainId}
        currentCustomSlug={customSlug}
        onPublish={handlePublish}
        publishing={publishing}
      />

      {/* Main Content */}
      <div className="flex">
        {/* Editor/Preview Area */}
        <div className={`flex-1 transition-all ${showSeoPanel && !isPreview ? 'mr-80' : ''}`}>
          <div className={`mx-auto p-6 space-y-4 ${isPreview ? 'max-w-3xl' : 'max-w-6xl'}`}>
            {isPreview ? (
              /* Preview Mode */
              <div className="bg-white rounded-xl border p-8">
                <article>
                  <header className="mb-8 pb-6 border-b">
                    <h1 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">
                      {title || 'Untitled Blog Post'}
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
                      <span>•</span>
                      <span>{content.split(/\s+/).filter(Boolean).length} words</span>
                    </div>
                  </header>
                  
                  <div 
                    className="prose prose-slate prose-lg max-w-none
                      prose-headings:font-bold prose-headings:text-slate-900
                      prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4
                      prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                      prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
                      prose-p:text-slate-700 prose-p:leading-relaxed prose-p:mb-4
                      prose-ul:my-4 prose-ul:pl-6
                      prose-li:text-slate-700 prose-li:mb-2
                      prose-strong:text-slate-900
                      prose-blockquote:border-l-4 prose-blockquote:border-[#918df6] prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600
                      prose-img:rounded-xl prose-img:shadow-sm"
                    dangerouslySetInnerHTML={{ __html: content || '<p class="text-slate-400">No content yet...</p>' }} 
                  />
                </article>
              </div>
            ) : (
              /* Editor Mode */
              <>
                {/* Title & Excerpt */}
                <div className="bg-white rounded-xl border p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs text-muted-foreground">Title</Label>
                    <Input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter your blog title..."
                      className="text-2xl font-semibold h-auto py-3 border-0 px-0 focus-visible:ring-0 placeholder:text-slate-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt" className="text-xs text-muted-foreground">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="Brief summary for blog listings..."
                      rows={2}
                      className="border-0 px-0 focus-visible:ring-0 resize-none placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Editor */}
                <BlogEditorPro content={content} onChange={setContent} />
              </>
            )}
          </div>
        </div>

        {/* SEO Sidebar */}
        {showSeoPanel && (
          <div className="fixed right-0 top-14 bottom-0 w-80 bg-white border-l overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">SEO Settings</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowSeoPanel(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* SEO Score */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">SEO Score</span>
                  <Badge className={
                    seoAnalysis.score >= 80 ? 'bg-green-100 text-green-700' :
                    seoAnalysis.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }>
                    {seoAnalysis.score}/100
                  </Badge>
                </div>
                <Progress value={seoAnalysis.score} className="h-2" />

                {seoAnalysis.issues.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {seoAnalysis.issues.slice(0, 3).map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-destructive">
                        <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                )}

                {seoAnalysis.suggestions.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {seoAnalysis.suggestions.slice(0, 2).map((suggestion, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SEO Title */}
              <div className="space-y-2">
                <Label htmlFor="seoTitle" className="text-sm">SEO Title</Label>
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

              {/* Meta Description */}
              <div className="space-y-2">
                <Label htmlFor="seoDescription" className="text-sm">Meta Description</Label>
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

              {/* Keywords */}
              <div className="space-y-2">
                <Label className="text-sm">Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="Add keyword"
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={addKeyword}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {seoKeywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      variant="secondary"
                      className="gap-1 text-xs"
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

              {/* Copy HTML */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(content);
                  toast.success('Content copied to clipboard!');
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy HTML
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
