'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { FloatingNav } from '@/components/FloatingNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  FileText,
  Eye,
  BarChart3,
} from 'lucide-react';

// Mock data for analytics
const generateMockData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day) => ({
    name: day,
    views: Math.floor(Math.random() * 500) + 100,
    posts: Math.floor(Math.random() * 5),
  }));
};

const generateMonthlyData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((month) => ({
    name: month,
    views: Math.floor(Math.random() * 3000) + 500,
    posts: Math.floor(Math.random() * 20) + 5,
  }));
};

const COLORS = ['#918df6', '#7b77e0', '#6560ca', '#4f4ab4'];

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [blogCounts, setBlogCounts] = useState({ all: 0, drafts: 0, published: 0 });
  const [weeklyData] = useState(generateMockData());
  const [monthlyData] = useState(generateMonthlyData());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Published', value: blogCounts.published },
    { name: 'Drafts', value: blogCounts.drafts },
  ];

  const totalViews = weeklyData.reduce((sum, d) => sum + d.views, 0);
  const avgViews = Math.round(totalViews / weeklyData.length);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <FloatingNav />
      <div className="max-w-6xl mx-auto px-6 py-8 pb-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-500">Track your blog performance</p>
        </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div 
              className="bg-white rounded-xl p-5 transition-all hover:bg-slate-50/50"
              style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#918df6]/10 flex items-center justify-center">
                    <Eye className="w-4.5 h-4.5 text-[#918df6]" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Total Views</span>
                </div>
                <p className="text-3xl font-semibold text-slate-900">{totalViews.toLocaleString()}</p>
              </div>
            </div>
            <div 
              className="bg-white rounded-xl p-5 transition-all hover:bg-slate-50/50"
              style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <FileText className="w-4.5 h-4.5 text-green-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Total Blogs</span>
                </div>
                <p className="text-3xl font-semibold text-slate-900">{blogCounts.all}</p>
              </div>
            </div>
            <div 
              className="bg-white rounded-xl p-5 transition-all hover:bg-slate-50/50"
              style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Avg. Daily Views</span>
                </div>
                <p className="text-3xl font-semibold text-slate-900">{avgViews}</p>
              </div>
            </div>
            <div 
              className="bg-white rounded-xl p-5 transition-all hover:bg-slate-50/50"
              style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <BarChart3 className="w-4.5 h-4.5 text-amber-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Published Blogs</span>
                </div>
                <p className="text-3xl font-semibold text-slate-900">{blogCounts.published}</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <Tabs defaultValue="weekly" className="space-y-4">
            <TabsList>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Area Chart */}
                <Card className="col-span-2 rounded-xl" style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Views This Week</CardTitle>
                    <CardDescription className="text-xs">Daily page views</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <div className="h-75">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#918df6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#918df6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '12px', 
                              border: '1px solid #e5e7eb',
                              boxShadow: 'none'
                            }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="views" 
                            stroke="#918df6" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorViews)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card className="rounded-xl" style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Post Status</CardTitle>
                    <CardDescription className="text-xs">Published vs Drafts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-50">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '12px', 
                              border: '1px solid #e5e7eb',
                              boxShadow: 'none'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#918df6]" />
                        <span className="text-xs">Published ({blogCounts.published})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#7b77e0]" />
                        <span className="text-xs">Drafts ({blogCounts.drafts})</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-4">
              <Card className="rounded-xl" style={{ border: '0.5px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Overview</CardTitle>
                  <CardDescription className="text-xs">Views over time</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-75">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorMonthlyViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#918df6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#918df6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: '1px solid #e5e7eb',
                            boxShadow: 'none'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="views" 
                          stroke="#918df6" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorMonthlyViews)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}
