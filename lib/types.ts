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

export const CATEGORIES = [
  'Food',
  'Transport',
  'Entertainment',
  'Bills',
  'Shopping',
  'Health',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];
// test
