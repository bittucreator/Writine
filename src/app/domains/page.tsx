'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FloatingNav } from '@/components/FloatingNav';
import {
  Plus,
  Globe,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  ExternalLink,
  Copy,
} from 'lucide-react';

interface Domain {
  id: string;
  domain: string;
  status: 'pending' | 'verified' | 'failed';
  created_at: string;
}

export default function DomainsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setCredits] = useState(0);
  const [, setBlogCounts] = useState({ all: 0, drafts: 0, published: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch credits
      const { data: creditsData } = await supabase
        .from('credits_balance')
        .select('balance')
        .eq('user_id', user!.id)
        .single();
      
      if (creditsData) {
        setCredits(creditsData.balance);
      }

      // Fetch blog counts
      const { data: blogs } = await supabase
        .from('blogs')
        .select('id, status')
        .eq('user_id', user!.id);
      
      if (blogs) {
        setBlogCounts({
          all: blogs.length,
          drafts: blogs.filter(b => b.status === 'draft').length,
          published: blogs.filter(b => b.status === 'published').length,
        });
      }

      // Fetch domains
      const { data } = await supabase
        .from('custom_domains')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (data) setDomains(data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;

    setAdding(true);
    try {
      const { error } = await supabase.from('custom_domains').insert({
        user_id: user?.id,
        domain: newDomain.toLowerCase().trim(),
        status: 'pending',
      });

      if (error) throw error;

      setNewDomain('');
      setShowAddModal(false);
      loadData();
    } catch (error) {
      console.error('Error adding domain:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_domains')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDomains(domains.filter((d) => d.id !== id));
    } catch (error) {
      console.error('Error deleting domain:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-amber-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-amber-100 text-amber-700';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <FloatingNav />
      <div className="max-w-6xl mx-auto px-6 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold mb-1">Domains</h1>
            <p className="text-sm text-muted-foreground">Manage your custom domains</p>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            Add Domain
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#918df6]/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-[#918df6]" />
                </div>
                <span className="text-xs text-muted-foreground">All Domains</span>
              </div>
              <p className="text-2xl font-semibold">{domains.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-xs text-muted-foreground">Verified</span>
              </div>
              <p className="text-2xl font-semibold">{domains.filter(d => d.status === 'verified').length}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              <p className="text-2xl font-semibold">{domains.filter(d => d.status === 'pending').length}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-xs text-muted-foreground">Failed</span>
              </div>
              <p className="text-2xl font-semibold">{domains.filter(d => d.status === 'failed').length}</p>
            </div>
          </div>
        </div>

        {/* Domains List */}
        {domains.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium mb-1">No custom domains</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-75 mx-auto">
              Add a custom domain to publish your blog under your own brand
            </p>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Domain
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {domains.map((domain) => (
              <div
                key={domain.id}
                className="bg-white rounded-2xl border p-4 flex items-center justify-between hover:border-[#918df6] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{domain.domain}</p>
                      <Badge className={`text-[10px] ${getStatusBadge(domain.status)}`}>
                        {getStatusIcon(domain.status)}
                        <span className="ml-1 capitalize">{domain.status}</span>
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(domain.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {domain.status === 'verified' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => window.open(`https://${domain.domain}`, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Visit
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteDomain(domain.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Setup Instructions */}
        <Card className="mt-6 rounded-2xl">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4">How to set up your domain</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#918df6] text-white flex items-center justify-center text-xs font-medium shrink-0">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium">Add your domain</p>
                  <p className="text-xs text-muted-foreground">Enter your custom domain above</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#918df6] text-white flex items-center justify-center text-xs font-medium shrink-0">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium">Configure DNS</p>
                  <p className="text-xs text-muted-foreground mb-2">Add a CNAME record pointing to:</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">blog.writine.com</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard('blog.writine.com')}
                    >
                      <Copy className={`w-3 h-3 ${copied ? 'text-green-600' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#918df6] text-white flex items-center justify-center text-xs font-medium shrink-0">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium">Wait for verification</p>
                  <p className="text-xs text-muted-foreground">DNS propagation takes up to 48 hours. We&apos;ll automatically verify and provision SSL.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Domain Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Domain</DialogTitle>
              <DialogDescription>
                Connect your own domain to your blog
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain Name</Label>
                <Input
                  id="domain"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="blog.example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your subdomain (e.g., blog.example.com) or root domain
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDomain} disabled={adding || !newDomain.trim()}>
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Domain'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
