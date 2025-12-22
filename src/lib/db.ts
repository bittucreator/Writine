// API wrapper for database operations (proxied through our API)
// This hides the Supabase URL from network tabs

interface QueryOptions {
  select?: string;
  filters?: Record<string, unknown>;
  order?: string;
  limit?: number;
  accessToken?: string;
}

export const db = {
  async get(table: string, options: QueryOptions = {}) {
    const params = new URLSearchParams({ table });
    
    if (options.select) params.set('select', options.select);
    if (options.filters) params.set('filters', JSON.stringify(options.filters));
    if (options.order) params.set('order', options.order);
    if (options.limit) params.set('limit', options.limit.toString());

    const headers: Record<string, string> = {};
    if (options.accessToken) {
      headers['Authorization'] = `Bearer ${options.accessToken}`;
    }

    const response = await fetch(`/api/db?${params.toString()}`, { headers });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch data');
    }
    
    return result.data;
  },

  async insert(table: string, data: unknown, accessToken?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch('/api/db', {
      method: 'POST',
      headers,
      body: JSON.stringify({ table, data }),
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to insert data');
    }
    
    return result.data;
  },

  async update(table: string, id: string, data: unknown, accessToken?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch('/api/db', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ table, id, data }),
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update data');
    }
    
    return result.data;
  },

  async delete(table: string, id: string, accessToken?: string) {
    const params = new URLSearchParams({ table, id });
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`/api/db?${params.toString()}`, {
      method: 'DELETE',
      headers,
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete data');
    }
    
    return result.success;
  },
};
