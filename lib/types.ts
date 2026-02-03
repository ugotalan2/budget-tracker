export type Category = {
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

// Helper type for categories with their children
export type CategoryWithChildren = Category & {
  children?: Category[];
};

// Keep old CATEGORIES array for migration reference
export const DEFAULT_CATEGORIES = [
  'Food',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Utilities',
  'Healthcare',
  'Other',
] as const;

// Color options for categories (reuse from accounts)
export const CATEGORY_COLORS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#84CC16', label: 'Lime' },
  { value: '#F97316', label: 'Deep Orange' },
];

export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'loan';
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

export type Expense = {
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

export type Budget = {
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

// Account type options
export const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'investment', label: 'Investment Account' },
  { value: 'loan', label: 'Loan' },
] as const;

// Color options for accounts
export const ACCOUNT_COLORS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#14B8A6', label: 'Teal' },
];

// Keep for backward compatibility during migration
export const CATEGORIES = DEFAULT_CATEGORIES;
