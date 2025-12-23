import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

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
  params: Promise<{ domain: string; slug?: string[] }>;
}

async function getDomainOwner(domain: string) {
  const supabase = getSupabase();
  // Get the custom domain record
  const { data: domainRecord } = await supabase
    .from('custom_domains')
    .select('user_id, status')
    .eq('domain', domain)
    .eq('status', 'verified')
    .single();

  if (!domainRecord) return null;

  // Get user profile
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('id, full_name, username')
    .eq('id', domainRecord.user_id)
    .single();

  return userProfile;
}

async function getBlogData(userId: string, slug: string) {
  const supabase = getSupabase();
  const { data: blog } = await supabase
    .from('blogs')
    .select('*')
    .eq('user_id', userId)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  return blog;
}

async function getUserBlogs(userId: string) {
  const supabase = getSupabase();
  const { data: blogs } = await supabase
    .from('blogs')
    .select('id, title, slug, excerpt, featured_image, created_at')
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  return blogs || [];
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
  const { domain, slug } = await params;
  const blogSlug = slug?.[0];
  
  const userProfile = await getDomainOwner(domain);
  
  if (!userProfile) {
    return { title: 'Not Found' };
  }

  if (blogSlug) {
    const blog = await getBlogData(userProfile.id, blogSlug);
    if (blog) {
      return {
        title: blog.title,
        description: blog.excerpt || blog.meta_description || `Read ${blog.title}`,
        openGraph: {
          title: blog.title,
          description: blog.excerpt || blog.meta_description,
          images: blog.featured_image ? [blog.featured_image] : [],
        },
      };
    }
  }

  return {
    title: `${userProfile.full_name || userProfile.username}'s Blog`,
    description: `Blog posts on ${domain}`,
  };
}

export default async function CustomDomainBlogPage({ params }: Props) {
  const { domain, slug } = await params;
  const blogSlug = slug?.[0];

  const userProfile = await getDomainOwner(domain);

  if (!userProfile) {
    notFound();
  }

  // Check if user is Pro
  const isPro = await isProUser(userProfile.id);

  // If there's a slug, show the specific blog
  if (blogSlug) {
    const blog = await getBlogData(userProfile.id, blogSlug);

    if (!blog) {
      notFound();
    }

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
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-8">
            <time dateTime={blog.created_at}>
              {new Date(blog.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {blog.reading_time && <span>{blog.reading_time} min read</span>}
          </div>

          {/* Content */}
          <div
            className="prose prose-lg max-w-none"
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
                width={18}
                height={18}
                className="opacity-50"
              />
              Powered by Writine
            </Link>
          </footer>
        )}
      </div>
    );
  }

  // No slug - show blog listing
  const blogs = await getUserBlogs(userProfile.id);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl font-bold mb-2">
            {userProfile.full_name || userProfile.username}&apos;s Blog
          </h1>
          <p className="text-gray-500">{blogs.length} published posts</p>
        </header>

        {/* Blog Grid */}
        {blogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No published blogs yet.
          </div>
        ) : (
          <div className="grid gap-8">
            {blogs.map((blog) => (
              <a
                key={blog.id}
                href={`/${blog.slug}`}
                className="block group"
              >
                <article className="flex gap-6">
                  {blog.featured_image && (
                    <div className="w-48 h-32 rounded-xl overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={blog.featured_image}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold mb-2 group-hover:text-[#8345dd] transition-colors">
                      {blog.title}
                    </h2>
                    {blog.excerpt && (
                      <p className="text-gray-500 line-clamp-2 mb-2">
                        {blog.excerpt}
                      </p>
                    )}
                    <time className="text-sm text-gray-400">
                      {new Date(blog.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                </article>
              </a>
            ))}
          </div>
        )}
      </div>

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
              width={18}
              height={18}
              className="opacity-50"
            />
            Powered by Writine
          </Link>
        </footer>
      )}
    </div>
  );
}
