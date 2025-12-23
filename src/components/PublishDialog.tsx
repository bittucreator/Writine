'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Globe,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Plus,
} from 'lucide-react';

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'verified' | 'failed';
}

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blogId: string;
  blogTitle: string;
  blogSlug: string;
  currentDomainId?: string | null;
  currentCustomSlug?: string | null;
  onPublish: (data: { domainId: string | null; customSlug: string; publishedUrl: string }) => void;
  publishing?: boolean;
}

export function PublishDialog({
  open,
  onOpenChange,
  blogId: _blogId,
  blogTitle,
  blogSlug,
  currentDomainId,
  currentCustomSlug,
  onPublish,
  publishing = false,
}: PublishDialogProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>('none');
  const [customSlug, setCustomSlug] = useState('');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const prevOpenRef = useRef(false);

  // Suppress unused variable warning
  void _blogId;

  const loadDomains = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.get<Domain>('custom_domains', {
        filters: { status: 'verified' },
        order: 'created_at:desc'
      });

      if (data) {
        setDomains(data);
      }
    } catch (error) {
      console.error('Error loading domains:', error);
    }
    setLoading(false);
  }, []);

  // Handle dialog open/close transitions
  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;
    
    // Only initialize when dialog opens (transition from closed to open)
    if (open && !wasOpen) {
      startTransition(() => {
        loadDomains();
        setCustomSlug(currentCustomSlug || blogSlug || '');
        setSelectedDomain(currentDomainId || 'none');
        setSlugError(null);
        setCopied(false);
      });
    }
  }, [open, loadDomains, currentDomainId, currentCustomSlug, blogSlug]);

  const validateSlug = (slug: string) => {
    if (!slug.trim()) {
      return 'Slug is required';
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    if (slug.length < 3) {
      return 'Slug must be at least 3 characters';
    }
    if (slug.length > 100) {
      return 'Slug must be less than 100 characters';
    }
    return null;
  };

  const handleSlugChange = (value: string) => {
    const formatted = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    setCustomSlug(formatted);
    setSlugError(validateSlug(formatted));
  };

  const getPublishedUrl = () => {
    if (selectedDomain === 'none') {
      return `https://writine.com/blog/${customSlug}`;
    }
    const domain = domains.find(d => d.id === selectedDomain);
    return domain ? `https://${domain.domain}/${customSlug}` : '';
  };

  const handlePublish = () => {
    const error = validateSlug(customSlug);
    if (error) {
      setSlugError(error);
      return;
    }

    onPublish({
      domainId: selectedDomain === 'none' ? null : selectedDomain,
      customSlug,
      publishedUrl: getPublishedUrl(),
    });
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(getPublishedUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifiedDomains = domains.filter(d => d.status === 'verified');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#918df6]" />
            Publish Blog
          </DialogTitle>
          <DialogDescription>
            Choose where to publish your blog and customize the URL.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Blog Title Preview */}
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Publishing</p>
            <p className="font-medium text-sm line-clamp-1">{blogTitle || 'Untitled Blog'}</p>
          </div>

          {/* Domain Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Domain</Label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading domains...
              </div>
            ) : (
              <RadioGroup value={selectedDomain} onValueChange={setSelectedDomain}>
                {/* Default Domain */}
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer" style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}>
                  <RadioGroupItem value="none" id="domain-none" />
                  <Label htmlFor="domain-none" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">writine.com</span>
                      <Badge variant="secondary" className="text-[10px]">Default</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Free subdomain on our platform
                    </p>
                  </Label>
                </div>

                {/* Custom Domains */}
                {verifiedDomains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer"
                    style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}
                  >
                    <RadioGroupItem value={domain.id} id={`domain-${domain.id}`} />
                    <Label htmlFor={`domain-${domain.id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#918df6]" />
                        <span className="font-medium">{domain.domain}</span>
                        <Badge className="text-[10px] bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                    </Label>
                  </div>
                ))}

                {verifiedDomains.length === 0 && (
                  <div className="p-4 rounded-lg text-center" style={{ border: '1px dashed rgba(0, 0, 0, 0.12)' }}>
                    <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No custom domains connected</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/domains', '_blank')}
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Domain
                    </Button>
                  </div>
                )}
              </RadioGroup>
            )}
          </div>

          {/* Custom Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-sm font-medium">URL Slug</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  /
                </div>
                <Input
                  id="slug"
                  value={customSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="my-blog-post"
                  className={`pl-6 ${slugError ? 'border-destructive' : ''}`}
                />
              </div>
            </div>
            {slugError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {slugError}
              </p>
            )}
          </div>

          {/* URL Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Published URL</Label>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm text-slate-600 truncate flex-1">
                {getPublishedUrl()}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0"
                onClick={copyUrl}
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0"
                onClick={() => window.open(getPublishedUrl(), '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={publishing || !!slugError}
            className="bg-[#918df6] hover:bg-[#7b77e0]"
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Publish
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
