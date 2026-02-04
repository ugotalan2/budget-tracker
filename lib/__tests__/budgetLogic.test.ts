import {
  calculateChildBudgetSum,
  shouldAutoIncrease,
  shouldAutoDecrease,
  calculateBudgetPercentage,
  isOverBudget,
  calculateRemaining,
} from '../budgetHelpers';

describe('budgetHelpers', () => {
  describe('calculateChildBudgetSum', () => {
    it('should sum child budgets correctly', () => {
      const mockBudgets = [
        { category_id: 'child-1', limit_amount: 500 },
        { category_id: 'child-2', limit_amount: 300 },
        { category_id: 'other', limit_amount: 1000 },
      ];

      const mockCategories = [
        { id: 'child-1', parent_id: 'parent-1' },
        { id: 'child-2', parent_id: 'parent-1' },
        { id: 'other', parent_id: 'parent-2' },
      ];

      const sum = calculateChildBudgetSum(
        mockBudgets,
        'parent-1',
        mockCategories
      );
      expect(sum).toBe(800);
    });

    it('should return 0 when no children exist', () => {
      const mockBudgets = [{ category_id: 'other', limit_amount: 1000 }];

      const mockCategories = [{ id: 'other', parent_id: 'parent-2' }];

      const sum = calculateChildBudgetSum(
        mockBudgets,
        'parent-1',
        mockCategories
      );
      expect(sum).toBe(0);
    });
  });

  describe('shouldAutoIncrease', () => {
    it('should return true when children exceed parent', () => {
      expect(shouldAutoIncrease(1500, 1000)).toBe(true);
    });

    it('should return false when children fit within parent', () => {
      expect(shouldAutoIncrease(800, 1000)).toBe(false);
    });

    it('should return false when equal', () => {
      expect(shouldAutoIncrease(1000, 1000)).toBe(false);
    });
  });

  describe('shouldAutoDecrease', () => {
    it('should return true when parent equals old sum and new sum is lower', () => {
      expect(shouldAutoDecrease(1000, 800, 1000)).toBe(true);
    });

    it('should return false when parent has buffer', () => {
      expect(shouldAutoDecrease(800, 600, 1000)).toBe(false);
    });

    it('should return false when new sum equals parent', () => {
      expect(shouldAutoDecrease(1000, 1000, 1000)).toBe(false);
    });
  });

  describe('calculateBudgetPercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculateBudgetPercentage(750, 1000)).toBe(75);
    });

    it('should cap at 100', () => {
      expect(calculateBudgetPercentage(1500, 1000)).toBe(100);
    });

    it('should handle zero budget', () => {
      expect(calculateBudgetPercentage(100, 0)).toBe(0);
    });

    it('should handle zero spent', () => {
      expect(calculateBudgetPercentage(0, 1000)).toBe(0);
    });
  });

  describe('isOverBudget', () => {
    it('should detect over budget', () => {
      expect(isOverBudget(1200, 1000)).toBe(true);
    });

    it('should return false when under budget', () => {
      expect(isOverBudget(800, 1000)).toBe(false);
    });

    it('should return false when exactly at budget', () => {
      expect(isOverBudget(1000, 1000)).toBe(false);
    });
  });

  describe('calculateRemaining', () => {
    it('should calculate remaining budget', () => {
      expect(calculateRemaining(600, 1000)).toBe(400);
    });

    it('should handle negative (over budget)', () => {
      expect(calculateRemaining(1200, 1000)).toBe(-200);
    });

    it('should handle exactly at budget', () => {
      expect(calculateRemaining(1000, 1000)).toBe(0);
    });
  });
});
