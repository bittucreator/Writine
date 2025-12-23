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
    const advancedFilters = searchParams.get('advancedFilters');
    const order = searchParams.get('order');
    const limit = searchParams.get('limit');

    if (!table) {
      return NextResponse.json({ error: 'Table is required' }, { status: 400 });
    }

    let query = supabase.from(table).select(select);

    // Apply simple filters (eq only)
    if (filters) {
      const filterObj = JSON.parse(filters);
      for (const [key, value] of Object.entries(filterObj)) {
        query = query.eq(key, value);
      }
    }

    // Apply advanced filters with operators
    if (advancedFilters) {
      const advFilters = JSON.parse(advancedFilters) as Array<{ column: string; operator: string; value: unknown }>;
      for (const filter of advFilters) {
        const { column, operator, value } = filter;
        switch (operator) {
          case 'eq': query = query.eq(column, value); break;
          case 'neq': query = query.neq(column, value); break;
          case 'gt': query = query.gt(column, value); break;
          case 'gte': query = query.gte(column, value); break;
          case 'lt': query = query.lt(column, value); break;
          case 'lte': query = query.lte(column, value); break;
          case 'like': query = query.like(column, value as string); break;
          case 'ilike': query = query.ilike(column, value as string); break;
          case 'is': query = query.is(column, value as null); break;
          case 'in': query = query.in(column, value as unknown[]); break;
        }
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
    
    const { table, id, data: updateData, filters } = await request.json();

    if (!table || !updateData) {
      return NextResponse.json({ error: 'Table and data are required' }, { status: 400 });
    }

    let query = supabase.from(table).update(updateData);
    
    // Support both id-based and filter-based updates
    if (id) {
      query = query.eq('id', id);
    } else if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
    }

    const { data, error } = await query.select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    const supabase = getSupabaseClient(accessToken);
    
    const { table, data: upsertData, onConflict } = await request.json();

    if (!table || !upsertData) {
      return NextResponse.json({ error: 'Table and data are required' }, { status: 400 });
    }

    const options = onConflict ? { onConflict } : undefined;
    const { data, error } = await supabase.from(table).upsert(upsertData, options).select();

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
    
    const body = await request.json().catch(() => ({}));
    const { table, id, filters } = body;

    if (!table) {
      return NextResponse.json({ error: 'Table is required' }, { status: 400 });
    }

    let query = supabase.from(table).delete();
    
    if (id) {
      query = query.eq('id', id);
    } else if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
    } else {
      return NextResponse.json({ error: 'id or filters required' }, { status: 400 });
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
