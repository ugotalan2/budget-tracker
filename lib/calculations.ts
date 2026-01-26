import { Expense } from "./types";

export function calculateTotalByCategory(
	expenses: Expense[],
	category: string
): number {
	return expenses
		.filter((expense) => expense.category === category)
		.reduce((sum, expense) => sum + expense.amount, 0);
}

export function calculateTotal(expenses: Expense[]): number {
	return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

export function isBudgetExceeded(
	spend: number,
	budget: number
): boolean {
	return spend > budget;
}

export function getBudgetPercentage(
	spend: number, 
	budget: number
): number {
	if (budget === 0) return 0;
	return Math.round((spend / budget) * 100);
}

export function groupExpensesByCategory(
	expenses: Expense[]
): Record<string, Expense[]> {
	return expenses.reduce((grouped, expense) => {
		if (!grouped[expense.category]) {
			grouped[expense.category] = [];
		}
		grouped[expense.category].push(expense);
		return grouped;
	}, {} as Record<string, Expense[]>);
}

export function formatCurrency(amount: number) : string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	}).format(amount);
}

export function getMonthLabel(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
	year: 'numeric',
  });
}
