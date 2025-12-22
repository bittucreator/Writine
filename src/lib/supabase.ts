import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let _supabase: SupabaseClient | null = null;

export const supabase = (() => {
  if (!_supabase && supabaseUrl && supabaseAnonKey) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  if (!_supabase) {
    // Return a dummy client for build time - it won't be used
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  return _supabase;
})();

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      credits_balance: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          total_earned: number;
          total_spent: number;
          updated_at: string;
        };
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          transaction_type: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          transaction_type: string;
          description: string;
          created_at?: string;
        };
      };
      blogs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          excerpt: string;
          status: 'draft' | 'published';
          seo_title: string | null;
          seo_description: string | null;
          seo_keywords: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          excerpt?: string;
          status?: 'draft' | 'published';
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          excerpt?: string;
          status?: 'draft' | 'published';
          seo_title?: string | null;
          seo_description?: string | null;
          seo_keywords?: string[] | null;
          updated_at?: string;
        };
      };
    };
  };
};
