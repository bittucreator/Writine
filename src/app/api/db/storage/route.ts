import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient(accessToken?: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    accessToken ? {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    } : undefined
  );
  return supabase;
}

// Upload file to storage
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    const supabase = getSupabaseClient(accessToken);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const path = formData.get('path') as string;

    if (!file || !bucket || !path) {
      return NextResponse.json(
        { error: 'File, bucket, and path are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return NextResponse.json({ data: { ...data, publicUrl } });
  } catch (error) {
    console.error('Storage upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get public URL or download file
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket');
    const path = searchParams.get('path');
    const download = searchParams.get('download') === 'true';

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'Bucket and path are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    if (download) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return new NextResponse(data, {
        headers: {
          'Content-Type': data.type,
          'Content-Disposition': `attachment; filename="${path.split('/').pop()}"`,
        },
      });
    }

    // Return public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return NextResponse.json({ publicUrl });
  } catch (error) {
    console.error('Storage get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete file
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    const supabase = getSupabaseClient(accessToken);

    const { bucket, paths } = await request.json();

    if (!bucket || !paths || !Array.isArray(paths)) {
      return NextResponse.json(
        { error: 'Bucket and paths array are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Storage delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
