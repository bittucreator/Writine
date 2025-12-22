import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a function to get supabase client with user's token
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

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    const supabase = getSupabaseClient(accessToken);
    
    const { searchParams } = new URL(request.url);
    
    const table = searchParams.get('table');
    const select = searchParams.get('select') || '*';
    const filters = searchParams.get('filters');
    const order = searchParams.get('order');
    const limit = searchParams.get('limit');

    if (!table) {
      return NextResponse.json({ error: 'Table is required' }, { status: 400 });
    }

    let query = supabase.from(table).select(select);

    // Apply filters if provided
    if (filters) {
      const filterObj = JSON.parse(filters);
      for (const [key, value] of Object.entries(filterObj)) {
        query = query.eq(key, value);
      }
    }

    // Apply ordering
    if (order) {
      const [column, direction] = order.split(':');
      query = query.order(column, { ascending: direction !== 'desc' });
    }

    // Apply limit
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    const supabase = getSupabaseClient(accessToken);
    
    const { table, data: insertData } = await request.json();

    if (!table || !insertData) {
      return NextResponse.json({ error: 'Table and data are required' }, { status: 400 });
    }

    const { data, error } = await supabase.from(table).insert(insertData).select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    const supabase = getSupabaseClient(accessToken);
    
    const { table, id, data: updateData } = await request.json();

    if (!table || !id || !updateData) {
      return NextResponse.json({ error: 'Table, id, and data are required' }, { status: 400 });
    }

    const { data, error } = await supabase.from(table).update(updateData).eq('id', id).select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    const supabase = getSupabaseClient(accessToken);
    
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const id = searchParams.get('id');

    if (!table || !id) {
      return NextResponse.json({ error: 'Table and id are required' }, { status: 400 });
    }

    const { error } = await supabase.from(table).delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
