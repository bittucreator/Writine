import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/embed/[username] - Get all published posts for a user
// GET /api/embed/[username]?slug=my-post - Get a specific post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // CORS headers for embedding
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Find user by username
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, username, avatar_url, bio')
      .eq('username', username.toLowerCase())
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // If slug is provided, get specific post
    if (slug) {
      const { data: post, error: postError } = await supabase
        .from('blogs')
        .select('id, title, slug, content, excerpt, cover_image, created_at, reading_time, meta_description, meta_keywords')
        .eq('user_id', profile.id)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (postError || !post) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      return NextResponse.json({
        author: {
          name: profile.full_name,
          username: profile.username,
          avatar: profile.avatar_url,
          bio: profile.bio,
        },
        post,
      }, { headers: corsHeaders });
    }

    // Get all published posts
    const { data: posts, error: postsError, count } = await supabase
      .from('blogs')
      .select('id, title, slug, excerpt, cover_image, created_at, reading_time', { count: 'exact' })
      .eq('user_id', profile.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) {
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      author: {
        name: profile.full_name,
        username: profile.username,
        avatar: profile.avatar_url,
        bio: profile.bio,
      },
      posts: posts || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Embed API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
