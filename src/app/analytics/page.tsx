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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  FileText,
  Eye,
  Clock,
  CheckCircle,
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
        <div className="mb-6">
          <h1 className="text-xl font-semibold mb-1">Analytics</h1>
          <p className="text-sm text-muted-foreground">Track your blog performance</p>
        </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#918df6]/10 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-[#918df6]" />
                  </div>
                  <span className="text-xs text-muted-foreground">Total Views</span>
                </div>
                <p className="text-2xl font-semibold">{totalViews.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">Total Blogs</span>
                </div>
                <p className="text-2xl font-semibold">{blogCounts.all}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">Avg. Daily Views</span>
                </div>
                <p className="text-2xl font-semibold">{avgViews}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">Published Blogs</span>
                </div>
                <p className="text-2xl font-semibold">{blogCounts.published}</p>
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
                <Card className="col-span-2 rounded-2xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Views This Week</CardTitle>
                    <CardDescription className="text-xs">Daily page views</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-75">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyData}>
                          <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#918df6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#918df6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" />
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
                <Card className="rounded-2xl">
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
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Overview</CardTitle>
                  <CardDescription className="text-xs">Views and posts over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-75">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: '1px solid #e5e7eb',
                            boxShadow: 'none'
                          }} 
                        />h-75
                        <Bar dataKey="views" fill="#918df6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Recent Activity */}
          <Card className="mt-6 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Latest actions on your blog</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {blogCounts.all > 0 ? (
                  <>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm">{blogCounts.published} posts published</p>
                        <p className="text-xs text-muted-foreground">Keep up the great work!</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm">{blogCounts.drafts} drafts in progress</p>
                        <p className="text-xs text-muted-foreground">Finish and publish them soon</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No activity yet. Create your first post!</p>
                )}
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
