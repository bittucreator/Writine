import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

// Lazy Supabase client creation for build compatibility
const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(url, key);
};

interface Props {
  params: Promise<{ slug: string }>;
}

interface BlogWithSubscription {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  user_id: string;
  user_profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

async function getBlogBySlug(slug: string): Promise<BlogWithSubscription | null> {
  const supabase = getSupabase();
  
  // First try to find by custom_slug (for published blogs)
  let { data: blog } = await supabase
    .from('blogs')
    .select(`
      *,
      user_profiles:user_id (
        full_name,
        username,
        avatar_url
      )
    `)
    .eq('custom_slug', slug)
    .eq('status', 'published')
    .single();

  // If not found by custom_slug, try by regular slug
  if (!blog) {
    const { data: blogBySlug } = await supabase
      .from('blogs')
      .select(`
        *,
        user_profiles:user_id (
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    
    blog = blogBySlug;
  }

  return blog;
}

async function isProUser(userId: string): Promise<boolean> {
  const supabase = getSupabase();
  
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, plan')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  return subscription?.plan === 'pro';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return { title: 'Not Found' };
  }

  return {
    title: `${blog.title} | Writine`,
    description: blog.excerpt || blog.seo_description || `Read ${blog.title} on Writine`,
    openGraph: {
      title: blog.title,
      description: blog.excerpt || blog.seo_description,
      images: blog.featured_image ? [blog.featured_image] : [],
      type: 'article',
      publishedTime: blog.published_at || blog.created_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.excerpt || blog.seo_description,
      images: blog.featured_image ? [blog.featured_image] : [],
    },
  };
}

export default async function PublicBlogPage({ params }: Props) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  const author = blog.user_profiles;
  const wordCount = blog.content?.split(/\s+/).filter(Boolean).length || 0;
  const readingTime = Math.ceil(wordCount / 200);
  
  // Check if the blog author is a Pro user
  const isPro = await isProUser(blog.user_id);

  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-6 py-12">
        {/* Featured Image */}
        {blog.featured_image && (
          <div className="mb-8 rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blog.featured_image}
              alt={blog.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>

        {/* Author & Meta */}
        <div className="flex items-center gap-4 mb-8 pb-8 border-b">
          {author?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={author.avatar_url} 
              alt={author.full_name || 'Author'} 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#8345dd] flex items-center justify-center text-white font-medium">
              {(author?.full_name || 'A').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium">{author?.full_name || 'Anonymous'}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <time dateTime={blog.published_at || blog.created_at}>
                {new Date(blog.published_at || blog.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <span>•</span>
              <span>{readingTime} min read</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none prose-headings:font-semibold prose-a:text-[#8345dd] prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </article>

      {/* Powered by Writine - Only show for free users */}
      {!isPro && (
        <footer className="border-t py-8 text-center">
          <Link
            href="https://writine.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 text-sm text-gray-400 hover:text-[#8345dd] transition-colors"
          >
            <Image
              src="/writine-dark.svg"
              alt="Writine"
              width={20}
              height={20}
              className="opacity-50"
            />
            Powered by Writine
          </Link>
        </footer>
      )}
    </div>
  );
}
