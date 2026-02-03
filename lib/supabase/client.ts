import { createBrowserClient } from '@supabase/ssr';

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          parent_id: string | null;
          color: string;
          icon: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          parent_id?: string | null;
          color?: string;
          icon?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          parent_id?: string | null;
          color?: string;
          icon?: string | null;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type:
            | 'checking'
            | 'savings'
            | 'credit_card'
            | 'cash'
            | 'investment'
            | 'loan';
          is_primary: boolean;
          is_on_budget: boolean;
          track_balance: boolean;
          current_balance: number;
          color: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type:
            | 'checking'
            | 'savings'
            | 'credit_card'
            | 'cash'
            | 'investment'
            | 'loan';
          is_primary?: boolean;
          is_on_budget?: boolean;
          track_balance?: boolean;
          current_balance?: number;
          color?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?:
            | 'checking'
            | 'savings'
            | 'credit_card'
            | 'cash'
            | 'investment'
            | 'loan';
          is_primary?: boolean;
          is_on_budget?: boolean;
          track_balance?: boolean;
          current_balance?: number;
          color?: string;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          amount: number;
          category: string;
          category_id: string | null;
          description: string | null;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string | null;
          amount: number;
          category: string;
          category_id: string | null;
          description?: string | null;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id: string | null;
          amount?: number;
          category?: string;
          category_id: string | null;
          description?: string | null;
          date?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          category: string;
          category_id: string | null;
          limit_amount: number;
          month: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string | null;
          category: string;
          category_id: string | null;
          limit_amount: number;
          month: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id: string | null;
          category?: string;
          category_id: string | null;
          limit_amount?: number;
          month?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
