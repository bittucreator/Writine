import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Metadata } from 'next';
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
  params: Promise<{ slug: string }>;
}

async function getBlogBySlug(slug: string) {
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
            <div className="w-10 h-10 rounded-full bg-[#918df6] flex items-center justify-center text-white font-medium">
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
          className="prose prose-lg max-w-none prose-headings:font-semibold prose-a:text-[#918df6] prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </article>

      {/* Powered by Writine */}
      <footer className="border-t py-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#918df6] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 25.5C9.649 27.5 4.5 22.351 4.5 16S9.649 4.5 16 4.5 27.5 9.649 27.5 16 22.351 27.5 16 27.5z"/>
            <path d="M21.5 11h-11c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5h11c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5zM18.5 16h-8c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5h8c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5zM15.5 21h-5c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5h5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5z"/>
          </svg>
          Powered by Writine
        </Link>
      </footer>
    </div>
  );
}
