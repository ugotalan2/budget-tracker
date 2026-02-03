import {
  calculateTotalByCategory,
  calculateTotal,
  isBudgetExceeded,
  getBudgetPercentage,
  groupExpensesByCategory,
  formatCurrency,
  getMonthLabel,
} from './calculations';
import { Expense } from './types';

const mockExpenses: Expense[] = [
  {
    id: '1',
    user_id: 'user1',
    account_id: null,
    amount: 50,
    category: 'Food',
    description: 'Groceries',
    date: '2024-01-15',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    user_id: 'user1',
    account_id: null,
    amount: 30,
    category: 'Food',
    description: 'Restaurant',
    date: '2024-01-16',
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
  {
    id: '3',
    user_id: 'user1',
    account_id: null,
    amount: 20,
    category: 'Transport',
    description: 'Gas',
    date: '2024-01-17',
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
  },
];

describe('Calculation utilities', () => {
  describe('calculateTotalByCategory', () => {
    it('calculates total for existing category', () => {
      expect(calculateTotalByCategory(mockExpenses, 'Food')).toBe(80);
    });

    it('returns 0 for non-existent category', () => {
      expect(calculateTotalByCategory(mockExpenses, 'Entertainment')).toBe(0);
    });

    it('returns 0 for empty array', () => {
      expect(calculateTotalByCategory([], 'Food')).toBe(0);
    });
  });

  describe('calculateTotal', () => {
    it('calculates total of all expenses', () => {
      expect(calculateTotal(mockExpenses)).toBe(100);
    });

    it('returns 0 for empty array', () => {
      expect(calculateTotal([])).toBe(0);
    });
  });

  describe('isBudgetExceeded', () => {
    it('returns true when spending exceeds budget', () => {
      expect(isBudgetExceeded(150, 100)).toBe(true);
    });

    it('returns false when spending is within budget', () => {
      expect(isBudgetExceeded(80, 100)).toBe(false);
    });

    it('returns false when spending equals budget', () => {
      expect(isBudgetExceeded(100, 100)).toBe(false);
    });
  });

  describe('getBudgetPercentage', () => {
    it('calculates percentage correctly', () => {
      expect(getBudgetPercentage(50, 100)).toBe(50);
    });

    it('rounds to nearest integer', () => {
      expect(getBudgetPercentage(33, 100)).toBe(33);
    });

    it('returns 0 when budget is 0', () => {
      expect(getBudgetPercentage(50, 0)).toBe(0);
    });

    it('handles over-budget correctly', () => {
      expect(getBudgetPercentage(150, 100)).toBe(150);
    });
  });

  describe('groupExpensesByCategory', () => {
    it('groups expenses by category', () => {
      const grouped = groupExpensesByCategory(mockExpenses);
      expect(grouped.Food).toHaveLength(2);
      expect(grouped.Transport).toHaveLength(1);
    });

    it('returns empty object for empty array', () => {
      expect(groupExpensesByCategory([])).toEqual({});
    });
  });

  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(100)).toBe('$100.00');
    });

    it('handles decimals', () => {
      expect(formatCurrency(100.5)).toBe('$100.50');
    });

    it('handles negative numbers', () => {
      expect(formatCurrency(-50)).toBe('-$50.00');
    });
  });

  describe('getMonthLabel', () => {
    it('formats date to month label', () => {
      expect(getMonthLabel('2024-01-15')).toBe('January 2024');
    });

    it('handles different months', () => {
      // Use mid-month date to avoid timezone edge cases
      expect(getMonthLabel('2024-12-15')).toBe('December 2024');
    });
  });
});
