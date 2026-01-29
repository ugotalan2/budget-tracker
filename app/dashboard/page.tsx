'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type Expense, type Budget } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // const [selectedMonth, setSelectedMonth] = useState(
  // new Date().toISOString().slice(0, 7)
  // );
  const [selectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const supabase = createClient();

  // Fetch data for selected month
  const fetchData = async () => {
    setIsLoading(true);
    const monthStart = selectedMonth + '-01';
    const nextMonth = new Date(selectedMonth + '-01');
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthEnd = nextMonth.toISOString().slice(0, 10);

    const [expensesResults, budgetsResults] = await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .gte('date', monthStart)
        .lt('date', monthEnd)
        .order('date', { ascending: false }),
      supabase
        .from('budgets')
        .select('*')
        .gte('month', monthStart)
        .lt('month', monthEnd),
    ]);

    if (expensesResults.data) setExpenses(expensesResults.data);
    if (budgetsResults.data) setBudgets(budgetsResults.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  // Calculate stats
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalBudget = budgets.reduce(
    (sum, budget) => sum + budget.limit_amount,
    0
  );
  const remainingBudget = totalBudget - totalSpent;
  const budgetUsedPercentage =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Get spending by category
  //   const spendingByCategory = expenses.reduce(
  //     (category, expense) => {
  //       category[expense.category] =
  //         (category[expense.category] || 0) + expense.amount;
  //       return category;
  //     },
  //     {} as Record<string, number>
  //   );

  // Number of transactions
  const transactionCount = expenses.length;

  // Average transaction
  const avgTransaction =
    transactionCount > 0 ? totalSpent / transactionCount : 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Your spending overview for{' '}
            {new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Spent */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {transactionCount} transactions
            </p>
          </div>

          {/* Total Budget */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Budget
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatCurrency(totalBudget)}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {budgets.length} categories
            </p>
          </div>

          {/* Remaining Budget */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p
                  className={`mt-2 text-3xl font-bold ${
                    remainingBudget < 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatCurrency(Math.abs(remainingBudget))}
                </p>
              </div>
              <div
                className={`rounded-full p-3 ${
                  remainingBudget < 0 ? 'bg-red-100' : 'bg-green-100'
                }`}
              >
                <svg
                  className={`h-6 w-6 ${
                    remainingBudget < 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      remainingBudget < 0
                        ? 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
                        : 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                    }
                  />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {budgetUsedPercentage.toFixed(1)}% of budget
            </p>
          </div>

          {/* Average Transaction */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Transaction
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatCurrency(avgTransaction)}
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Per expense</p>
          </div>
        </div>

        {/* Placeholder for charts - we'll add these next */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Spending by Category
            </h2>
            <p className="text-gray-500">Chart coming next...</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Recent Transactions
            </h2>
            <div className="space-y-3">
              {expenses.slice(0, 5).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {expense.description || expense.category}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </p>
                    <p className="text-sm text-gray-500">{expense.category}</p>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && (
                <p className="text-center text-gray-500">No transactions yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
