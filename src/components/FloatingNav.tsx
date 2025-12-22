'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Earth,
  WalletCards,
  GalleryVerticalEnd,
  ChartColumnBig,
} from 'lucide-react';

export function FloatingNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setDisplayName(data.full_name || '');
          setAvatarUrl(data.avatar_url || null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    loadProfile();
  }, [user]);

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname === path || pathname.startsWith(path + '/');
  };

  const userName = displayName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { id: 'analytics', icon: ChartColumnBig, label: 'Analytics', path: '/analytics' },
    { id: 'templates', icon: GalleryVerticalEnd, label: 'Templates', path: '/templates' },
    { id: 'domains', icon: Earth, label: 'Domains', path: '/domains' },
    { id: 'billing', icon: WalletCards, label: 'Billing', path: '/billing' },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      {/* Floating Bottom Nav */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div 
          className="flex items-center gap-1 px-2 py-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-slate-200/50"
          style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}
        >
          {/* Logo */}
          <div className="flex items-center justify-center w-11 h-11">
            <Image 
              src="/writine-dark.svg" 
              alt="Writine" 
              width={24} 
              height={24}
              className="w-6 h-6"
            />
          </div>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* Nav Items */}
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => router.push(item.path)}
                  className={`
                    flex items-center justify-center w-11 h-11 rounded-xl transition-all
                    ${isActive(item.path) 
                      ? 'text-[#918df6]' 
                      : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-900 text-white border-0">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* User Profile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => router.push('/profile')}
                className="flex items-center justify-center w-11 h-11 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Avatar className="w-7 h-7 border-2 border-white shadow-sm">
                  <AvatarImage src={avatarUrl || undefined} alt={userName} />
                  <AvatarFallback className="text-xs bg-[#918df6] text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-slate-900 text-white border-0">
              <p>{userName}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
