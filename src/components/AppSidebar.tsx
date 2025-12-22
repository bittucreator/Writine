'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Globe,
  TrendingUp,
  User,
  CreditCard,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { ProfileModal } from './ProfileModal';
import { BillingModal } from './BillingModal';

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
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

  const refreshProfile = async () => {
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

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    if (path === '/drafts') return pathname === '/drafts';
    if (path === '/published') return pathname === '/published';
    return pathname === path || pathname.startsWith(path + '/');
  };

  // Get user display name
  const userName = displayName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <Sidebar className="border-r bg-white">
        {/* Logo Header with Dropdown */}
        <SidebarHeader className="px-3 py-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 w-full hover:bg-accent rounded-md px-2 py-1.5 transition-colors">
                <div className="w-5 h-5 flex items-center justify-center">
                  <Image 
                    src="/writine-dark.svg" 
                    alt="Writine" 
                    width={20} 
                    height={20}
                    className="w-5 h-5"
                  />
                </div>
                <span className="text-sm font-medium">Writine</span>
                <ChevronDown className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {/* User Info */}
              <div className="px-2 py-2">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
                    <AvatarFallback className="text-xs bg-[#918df6] text-white">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                <User className="w-4 h-4 mr-2" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBillingOpen(true)}>
                <CreditCard className="w-4 h-4 mr-2" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarHeader>
        
        <SidebarContent className="px-2">
          <SidebarGroup className="py-2">
            <SidebarMenu>
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isActive('/dashboard')}
                  onClick={() => router.push('/dashboard')}
                  className="text-xs h-8"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Analytics */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isActive('/analytics')}
                  onClick={() => router.push('/analytics')}
                  className="text-xs h-8"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Domains */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isActive('/domains')}
                  onClick={() => router.push('/domains')}
                  className="text-xs h-8"
                >
                  <Globe className="w-4 h-4" />
                  <span>Domains</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Modals */}
      <ProfileModal 
        open={profileOpen} 
        onOpenChange={(open) => {
          setProfileOpen(open);
          if (!open) refreshProfile(); // Refresh profile when modal closes
        }} 
      />
      <BillingModal open={billingOpen} onOpenChange={setBillingOpen} />
    </>
  );
}
