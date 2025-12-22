'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image: string;
  status: string;
  created_at: string;
  reading_time: number;
}

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  bio: string;
}

export default function SubdomainPage() {
  const params = useParams();
  const username = params.username as string;
  const slugParts = params.slug as string[] | undefined;
  const blogSlug = slugParts?.[0];

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, blogSlug]);

  const loadContent = async () => {
    setLoading(true);
    setError(null);

    try {
      // First, find the user by username
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username.toLowerCase())
        .single();

      if (profileError || !profile) {
        setError('User not found');
        setLoading(false);
        return;
      }

      setUserProfile(profile);
      
      // Check if user is Pro
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, plan')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .single();
      
      setIsPro(subscription?.plan === 'pro');

      if (blogSlug) {
        // Load specific blog
        const { data: blogData, error: blogError } = await supabase
          .from('blogs')
          .select('*')
          .eq('user_id', profile.id)
          .eq('slug', blogSlug)
          .eq('status', 'published')
          .single();

        if (blogError || !blogData) {
          setError('Blog not found');
        } else {
          setBlog(blogData);
        }
      } else {
        // Load all published blogs for this user
        const { data: blogsData } = await supabase
          .from('blogs')
          .select('*')
          .eq('user_id', profile.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        setBlogs(blogsData || []);
      }
    } catch (err) {
      console.error('Error loading content:', err);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">404</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link href="https://writine.com" className="text-[#918df6] hover:underline">
            Go to Writine
          </Link>
        </div>
      </div>
    );
  }

  // Single blog view
  if (blog) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b sticky top-0 bg-white/80 backdrop-blur-sm z-10">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link 
              href={`/`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all posts
            </Link>
            <div className="flex items-center gap-2">
              {userProfile?.avatar_url && (
                <img 
                  src={userProfile.avatar_url} 
                  alt={userProfile.full_name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm font-medium">{userProfile?.full_name}</span>
            </div>
          </div>
        </header>

        {/* Blog Content */}
        <article className="max-w-4xl mx-auto px-6 py-12">
          {blog.cover_image && (
            <img 
              src={blog.cover_image} 
              alt={blog.title}
              className="w-full h-64 md:h-96 object-cover rounded-2xl mb-8"
            />
          )}
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{blog.title}</h1>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(blog.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            {blog.reading_time && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {blog.reading_time} min read
              </div>
            )}
          </div>

          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </article>

        {/* Footer - Only show for free users */}
        {!isPro && (
          <footer className="border-t py-8 mt-12">
            <div className="max-w-4xl mx-auto px-6 text-center">
              <Link
                href="https://writine.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-sm text-gray-400 hover:text-[#918df6] transition-colors"
              >
                <Image
                  src="/writine-dark.svg"
                  alt="Writine"
                  width={18}
                  height={18}
                  className="opacity-50"
                />
                Powered by Writine
              </Link>
            </div>
          </footer>
        )}
      </div>
    );
  }

  // Blog listing (homepage)
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            {userProfile?.avatar_url && (
              <img 
                src={userProfile.avatar_url} 
                alt={userProfile.full_name}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{userProfile?.full_name}&apos;s Blog</h1>
              {userProfile?.bio && (
                <p className="text-muted-foreground mt-1">{userProfile.bio}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Blog Grid */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {blogs.map((post) => (
              <Link 
                key={post.id} 
                href={`/${post.slug}`}
                className="bg-white rounded-2xl border p-6 hover:border-[#918df6] transition-colors group"
              >
                <div className="flex gap-6">
                  {post.cover_image && (
                    <img 
                      src={post.cover_image} 
                      alt={post.title}
                      className="w-32 h-24 object-cover rounded-xl shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold group-hover:text-[#918df6] transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                      {post.reading_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.reading_time} min
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer - Only show for free users */}
      {!isPro && (
        <footer className="border-t py-8 mt-12 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Link
              href="https://writine.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 text-sm text-gray-400 hover:text-[#918df6] transition-colors"
            >
              <Image
                src="/writine-dark.svg"
                alt="Writine"
                width={18}
                height={18}
                className="opacity-50"
              />
              Powered by Writine
            </Link>
          </div>
        </footer>
      )}
    </div>
  );
}
