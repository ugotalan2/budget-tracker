import { Budget } from './types';

type BudgetLike = Pick<Budget, 'category_id' | 'limit_amount'>;
type CategoryLike = { id: string; parent_id: string | null };

export function calculateChildBudgetSum(
  budgets: BudgetLike[],
  parentCategoryId: string,
  categories: CategoryLike[]
): number {
  const childBudgets = budgets.filter((b) => {
    const cat = categories.find((c) => c.id === b.category_id);
    return cat?.parent_id === parentCategoryId;
  });

  return childBudgets.reduce((sum, b) => sum + b.limit_amount, 0);
}

export function shouldAutoIncrease(
  childSum: number,
  parentLimit: number
): boolean {
  return childSum > parentLimit;
}

export function shouldAutoDecrease(
  oldChildSum: number,
  newChildSum: number,
  parentLimit: number
): boolean {
  // Only decrease if parent was exactly equal to old child sum
  return oldChildSum === parentLimit && newChildSum < parentLimit;
}

export function calculateBudgetPercentage(
  spent: number,
  budget: number
): number {
  if (budget === 0) return 0;
  return Math.min((spent / budget) * 100, 100);
}

export function isOverBudget(spent: number, budget: number): boolean {
  return spent > budget;
}

export function calculateRemaining(spent: number, budget: number): number {
  return budget - spent;
}
