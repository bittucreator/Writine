'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
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
  Loader2,
  ExternalLink,
  Copy,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

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
  const [username, setUsername] = useState<string | null>(null);
  const [, setCredits] = useState(0);
  const [, setBlogCounts] = useState({ all: 0, drafts: 0, published: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDnsModal, setShowDnsModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
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
      // Fetch user profile for username
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('id', user!.id)
        .single();
      
      if (profileData?.username) {
        setUsername(profileData.username);
      }

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

      toast.success('Domain added! Configure DNS to verify.');
      setNewDomain('');
      setShowAddModal(false);
      loadData();
    } catch (error) {
      console.error('Error adding domain:', error);
      toast.error('Failed to add domain');
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
      toast.success('Domain removed');
    } catch (error) {
      console.error('Error deleting domain:', error);
      toast.error('Failed to remove domain');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyDomain = async (domain: Domain) => {
    setVerifying(domain.id);
    try {
      // Method 1: Check CNAME record (for subdomains)
      const cnameResponse = await fetch(`https://dns.google/resolve?name=${domain.domain}&type=CNAME`);
      const cnameData = await cnameResponse.json();
      console.log('CNAME data:', cnameData);
      const hasCname = cnameData.Answer?.some((record: { data: string }) => 
        record.data?.toLowerCase().includes('writine.com')
      );

      // Method 2: Check TXT record for verification (works for root domains)
      // User should add: TXT record with value "writine-verify"
      const txtResponse = await fetch(`https://dns.google/resolve?name=${domain.domain}&type=TXT`);
      const txtData = await txtResponse.json();
      console.log('TXT data:', JSON.stringify(txtData, null, 2));
      
      let hasTxt = false;
      if (txtData.Answer && Array.isArray(txtData.Answer)) {
        for (const record of txtData.Answer) {
          console.log('Checking record:', record.data);
          // The data can come with or without quotes
          const value = String(record.data || '').replace(/^"|"$/g, '').replace(/\\"/g, '"').trim().toLowerCase();
          console.log('Cleaned value:', value);
          if (value.includes('writine-verify')) {
            hasTxt = true;
            break;
          }
        }
      }
      console.log('hasCname:', hasCname, 'hasTxt:', hasTxt);

      // Method 3: Check if domain resolves and we can reach it
      // For now, if they have CNAME or TXT, consider it verified
      const isVerified = hasCname || hasTxt;

      const newStatus = isVerified ? 'verified' : 'pending';
      
      const { error } = await supabase
        .from('custom_domains')
        .update({ status: newStatus })
        .eq('id', domain.id);

      if (error) throw error;

      setDomains(domains.map(d => 
        d.id === domain.id ? { ...d, status: newStatus } : d
      ));

      if (isVerified) {
        toast.success(`Domain verified! Your blogs are now accessible at ${domain.domain}`);
      } else {
        toast.error('DNS records not found yet', {
          description: 'Add a CNAME pointing to writine.com, or add a TXT record with value: writine-verify',
        });
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      toast.error('Error verifying domain. Please try again.');
    } finally {
      setVerifying(null);
    }
  };

  const openDnsRecords = (domain: Domain) => {
    setSelectedDomain(domain);
    setShowDnsModal(true);
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
      <div className="max-w-4xl mx-auto px-6 py-8 pb-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold mb-1">Publishing</h1>
          <p className="text-sm text-muted-foreground">Your blog URLs and custom domains</p>
        </div>

        {/* Your Blog URL */}
        <div className="bg-white rounded-2xl border p-5 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Your Blog</p>
                <p className="text-xs text-muted-foreground">
                  {username ? (
                    <span className="font-mono">{username}.writine.com</span>
                  ) : (
                    'Set a username to get your blog URL'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {username ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => copyToClipboard(`${username}.writine.com`)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => window.open(`https://${username}.writine.com`, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Visit
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  className="h-8 text-xs bg-[#918df6] hover:bg-[#7c78e3]"
                  onClick={() => router.push('/profile')}
                >
                  Set Username
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Custom Domains Section */}
        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Custom Domains</p>
              <p className="text-xs text-muted-foreground">Use your own domain</p>
            </div>
            <Button size="sm" className="h-8 text-xs" onClick={() => setShowAddModal(true)}>
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
          
          {domains.length === 0 ? (
            <div className="p-8 text-center">
              <Globe className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No custom domains yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{domain.domain}</span>
                      <Badge className={`text-[10px] ${getStatusBadge(domain.status)}`}>
                        {domain.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {domain.status !== 'verified' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setSelectedDomain(domain);
                            setShowDnsModal(true);
                          }}
                        >
                          DNS
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleVerifyDomain(domain)}
                          disabled={verifying === domain.id}
                        >
                          {verifying === domain.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Verify'
                          )}
                        </Button>
                      </>
                    )}
                    {domain.status === 'verified' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => window.open(`https://${domain.domain}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteDomain(domain.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Access - Compact */}
        <div className="bg-white rounded-2xl border p-5 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium">API Access</p>
                <p className="text-xs text-muted-foreground font-mono">/api/embed/{username || 'username'}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                const apiUrl = `https://writine.com/api/embed/${username || 'USERNAME'}`;
                copyToClipboard(apiUrl);
              }}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </div>
        </div>

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

        {/* DNS Records Modal */}
        <Dialog open={showDnsModal} onOpenChange={setShowDnsModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>DNS Setup</DialogTitle>
              <DialogDescription>
                {selectedDomain 
                  ? <>Configure DNS for <strong>{selectedDomain.domain}</strong></>
                  : 'Add these records at your domain registrar'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Option 1: CNAME for subdomains */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">Option 1</span>
                  <span className="text-sm font-medium">For subdomains</span>
                </div>
                <p className="text-xs text-muted-foreground">Use this for blog.yourdomain.com</p>
                <div className="bg-muted rounded-lg p-3">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-1">Type</p>
                      <p className="font-mono font-medium">CNAME</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Name</p>
                      <p className="font-mono font-medium">blog</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Value</p>
                      <div className="flex items-center gap-1">
                        <p className="font-mono font-medium">writine.com</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => copyToClipboard('writine.com')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t" />

              {/* Option 2: TXT for root domains */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Option 2</span>
                  <span className="text-sm font-medium">For root domains</span>
                </div>
                <p className="text-xs text-muted-foreground">Use this for yourdomain.com (verification only)</p>
                <div className="bg-muted rounded-lg p-3">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-1">Type</p>
                      <p className="font-mono font-medium">TXT</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Name</p>
                      <p className="font-mono font-medium">@</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Value</p>
                      <div className="flex items-center gap-1">
                        <p className="font-mono font-medium">writine-verify</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => copyToClipboard('writine-verify')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> DNS changes can take up to 48 hours to propagate.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDnsModal(false)}>
                Close
              </Button>
              {selectedDomain && (
                <Button 
                  className="bg-[#918df6] hover:bg-[#7c78e3]"
                  onClick={() => {
                    setShowDnsModal(false);
                    handleVerifyDomain(selectedDomain);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Now
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
