'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { FloatingNav } from '@/components/FloatingNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Loader2, Lock, Pencil, CheckCircle, LogOut, Globe, Copy } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url, username')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        const { data: fallbackData } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (fallbackData) {
          setFullName(fallbackData.full_name || '');
        }
        return;
      }

      if (data) {
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || null);
        setUsername(data.username || '');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ type: 'error', text: 'Failed to upload image. Please try again.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      // Validate username
      if (username) {
        const usernameRegex = /^[a-z0-9-]+$/;
        if (!usernameRegex.test(username)) {
          setUsernameError('Username can only contain lowercase letters, numbers, and hyphens');
          setSaving(false);
          return;
        }
        if (username.length < 3) {
          setUsernameError('Username must be at least 3 characters');
          setSaving(false);
          return;
        }
        // Check if username is taken
        const { data: existing } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('username', username)
          .neq('id', user.id)
          .single();
        if (existing) {
          setUsernameError('This username is already taken');
          setSaving(false);
          return;
        }
      }
      setUsernameError('');

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: email,
          full_name: fullName,
          username: username || null,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      if (avatarUrl) {
        await supabase
          .from('user_profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', user.id);
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (authError) throw authError;

      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        });
        if (emailError) throw emailError;
        setMessage({ type: 'success', text: 'Profile updated! Check your email to confirm the new address.' });
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }

      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setMessage({ type: 'error', text: 'Passwords do not match.' });
          setSaving(false);
          return;
        }
        if (newPassword.length < 6) {
          setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
          setSaving(false);
          return;
        }
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (passwordError) throw passwordError;
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: unknown) {
      const supabaseError = error as { message?: string };
      console.error('Error updating profile:', supabaseError.message || error);
      setMessage({ type: 'error', text: supabaseError.message || 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const userName = fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#918df6]" />
      </div>
    );
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
          <h2 className="text-2xl font-bold mb-2">Profile Settings</h2>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>

        {/* Content */}
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Avatar with upload */}
                  <div className="flex justify-center">
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Avatar className="w-20 h-20">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt={userName} />
                        ) : null}
                        <AvatarFallback className="text-2xl bg-[#918df6] text-white">
                          {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {uploadingImage ? (
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        ) : (
                          <Pencil className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm">
                        <User className="w-3.5 h-3.5 inline mr-2" />
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm">
                        <Globe className="w-3.5 h-3.5 inline mr-2" />
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                          setUsernameError('');
                        }}
                        placeholder="your-username"
                      />
                      {usernameError && (
                        <p className="text-xs text-red-500">{usernameError}</p>
                      )}
                      {username && !usernameError && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Your blog URL:</span>
                          <code className="bg-muted px-2 py-0.5 rounded">{username}.writine.com</code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${username}.writine.com`);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="hover:text-[#918df6]"
                          >
                            <Copy className={`w-3 h-3 ${copied ? 'text-green-600' : ''}`} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">
                        <Mail className="w-3.5 h-3.5 inline mr-2" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                      />
                      <p className="text-xs text-muted-foreground">
                        A confirmation email will be sent to verify the new address
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm">
                        <Lock className="w-3.5 h-3.5 inline mr-2" />
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm">
                        <Lock className="w-3.5 h-3.5 inline mr-2" />
                        Confirm Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  {message && (
                    <div className={`text-sm p-3 rounded-lg flex items-center gap-2 ${
                      message.type === 'success' 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {message.type === 'success' && <CheckCircle className="w-4 h-4" />}
                      {message.text}
                    </div>
                  )}

                  {/* Save Button */}
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="w-full bg-[#918df6] hover:bg-[#7b77e0]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>

                  {/* Logout Button */}
                  <Button 
                    onClick={async () => {
                      await signOut();
                      router.push('/login');
                    }}
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
