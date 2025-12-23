// API wrapper for database operations (proxied through our API)
// This hides the Supabase URL from network tabs

type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in';

interface AdvancedFilter {
  column: string;
  operator: FilterOperator;
  value: unknown;
}

interface QueryOptions {
  select?: string;
  filters?: Record<string, unknown>;
  advancedFilters?: AdvancedFilter[];
  order?: string;
  limit?: number;
  single?: boolean;
}

// Get auth token from Supabase localStorage
function getAuthToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  
  try {
    // Find the Supabase auth token in localStorage
    const keys = Object.keys(localStorage);
    const authKey = keys.find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
    
    if (authKey) {
      const data = JSON.parse(localStorage.getItem(authKey) || '{}');
      return data?.access_token;
    }
  } catch {
    // Ignore errors
  }
  
  return undefined;
}

function getHeaders(includeContentType = false): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
}

export const db = {
  async get<T = unknown>(table: string, options: QueryOptions = {}): Promise<T[]> {
    const params = new URLSearchParams({ table });
    
    if (options.select) params.set('select', options.select);
    if (options.filters) params.set('filters', JSON.stringify(options.filters));
    if (options.advancedFilters) params.set('advancedFilters', JSON.stringify(options.advancedFilters));
    if (options.order) params.set('order', options.order);
    if (options.limit) params.set('limit', options.limit.toString());

    const response = await fetch(`/api/db?${params.toString()}`, { 
      headers: getHeaders() 
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch data');
    }
    
    return result.data;
  },

  async getOne<T = unknown>(table: string, options: QueryOptions = {}): Promise<T | null> {
    const data = await this.get<T>(table, { ...options, limit: 1 });
    return data?.[0] || null;
  },

  async insert<T = unknown>(table: string, data: Record<string, unknown> | Record<string, unknown>[]): Promise<T[]> {
    const response = await fetch('/api/db', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ table, data }),
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to insert data');
    }
    
    return result.data;
  },

  async update<T = unknown>(
    table: string, 
    idOrFilters: string | Record<string, unknown>, 
    data: Record<string, unknown>
  ): Promise<T[]> {
    const body: Record<string, unknown> = { table, data };
    
    if (typeof idOrFilters === 'string') {
      body.id = idOrFilters;
    } else {
      body.filters = idOrFilters;
    }

    const response = await fetch('/api/db', {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(body),
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update data');
    }
    
    return result.data;
  },

  async upsert<T = unknown>(
    table: string, 
    data: Record<string, unknown>, 
    options?: { onConflict?: string }
  ): Promise<T[]> {
    const response = await fetch('/api/db', {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ table, data, onConflict: options?.onConflict }),
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to upsert data');
    }
    
    return result.data;
  },

  async delete(
    table: string, 
    idOrFilters: string | Record<string, unknown>
  ): Promise<boolean> {
    const body: Record<string, unknown> = { table };
    
    if (typeof idOrFilters === 'string') {
      body.id = idOrFilters;
    } else {
      body.filters = idOrFilters;
    }

    const response = await fetch('/api/db', {
      method: 'DELETE',
      headers: getHeaders(true),
      body: JSON.stringify(body),
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete data');
    }
    
    return result.success;
  },

  // Storage operations
  storage: {
    async upload(bucket: string, path: string, file: File): Promise<{ path: string; publicUrl: string }> {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('path', path);

      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/db/storage', {
        method: 'POST',
        headers,
        body: formData,
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload file');
      }
      
      return result.data;
    },

    async getPublicUrl(bucket: string, path: string): Promise<string> {
      const response = await fetch(`/api/db/storage?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get public URL');
      }
      
      return result.publicUrl;
    },

    async delete(bucket: string, paths: string[]): Promise<boolean> {
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/db/storage', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ bucket, paths }),
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete file');
      }
      
      return result.success;
    },
  },
};
