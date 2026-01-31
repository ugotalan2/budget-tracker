'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { type Expense, type Budget } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';
import CategoryChart from '@/components/dashboard/CategoryChart';
import SpendingTrendChart from '@/components/dashboard/SpendingTrendChart';
import BudgetComparisonChart from '@/components/dashboard/BudgetComparisonChart';
import {
  generateMonthOptions,
  getPreviousMonth,
  getNextMonth,
} from '@/lib/dateUtils';

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [prevMonthExpenses, setPrevMonthExpenses] = useState<Expense[]>([]);
  const supabase = createClient();

  // Fetch data for selected month
  const fetchData = async () => {
    setIsLoading(true);
    const monthStart = selectedMonth + '-01';
    const nextMonth = new Date(selectedMonth + '-01');
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthEnd = nextMonth.toISOString().slice(0, 10);

    // Previous month dates
    const prevMonthDate = getPreviousMonth(selectedMonth);
    const prevMonthStart = prevMonthDate + '-01';
    const prevMonthNext = new Date(prevMonthDate + '-01');
    prevMonthNext.setMonth(prevMonthNext.getMonth() + 1);
    const prevMonthEnd = prevMonthNext.toISOString().slice(0, 10);

    const [expensesRes, budgetsRes, prevExpensesRes] = await Promise.all([
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
      supabase
        .from('expenses')
        .select('*')
        .gte('date', prevMonthStart)
        .lt('date', prevMonthEnd),
    ]);

    if (expensesRes.data) setExpenses(expensesRes.data);
    if (budgetsRes.data) setBudgets(budgetsRes.data);
    if (prevExpensesRes.data) setPrevMonthExpenses(prevExpensesRes.data);
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

  // Month-over-month comparison
  const prevMonthTotal = prevMonthExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );
  const monthOverMonthChange =
    prevMonthTotal > 0
      ? ((totalSpent - prevMonthTotal) / prevMonthTotal) * 100
      : 0;
  const isIncreased = totalSpent > prevMonthTotal;

  // Prepare data for charts
  const categoryChartData = Object.entries(
    expenses.reduce(
      (categories, expense) => {
        categories[expense.category] =
          (categories[expense.category] || 0) + expense.amount;
        return categories;
      },
      {} as Record<string, number>
    )
  ).map(([category, amount]) => ({ category, amount }));

  // Spending trend by day
  const spendingByDay = expenses.reduce(
    (categories, expense) => {
      categories[expense.date] =
        (categories[expense.date] || 0) + expense.amount;
      return categories;
    },
    {} as Record<string, number>
  );

  const trendChartData = Object.entries(spendingByDay)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Budget comparison data
  const budgetComparisonData = budgets.map((budget) => {
    const spent = expenses
      .filter((expense) => expense.category === budget.category)
      .reduce((sum, expense) => sum + expense.amount, 0);

    return {
      category: budget.category,
      budget: budget.limit_amount,
      spent,
    };
  });

  // Number of transactions
  const transactionCount = expenses.length;

  // Average transaction
  const avgTransaction =
    transactionCount > 0 ? totalSpent / transactionCount : 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent dark:border-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Your spending overview for{' '}
              {new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMonth(getPreviousMonth(selectedMonth))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:focus:border-blue-400 dark:focus:ring-blue-400"
            >
              {generateMonthOptions(12).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Spent */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Spent
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
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
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {transactionCount} transactions
            </p>
          </div>

          {/* Total Budget */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Budget
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalBudget)}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                <svg
                  className="h-6 w-6 text-blue-600 dark:text-blue-300"
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
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {budgets.length} categories
            </p>
          </div>

          {/* Remaining Budget */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Remaining
                </p>
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
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {budgetUsedPercentage.toFixed(1)}% of budget
            </p>
          </div>

          {/* Average Transaction */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Transaction
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
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
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Per expense
            </p>
          </div>
        </div>

        {/* Month Comparison */}
        {prevMonthExpenses.length > 0 && (
          <div className="mb-8 rounded-lg border-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6 dark:border-gray-700 dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Month-over-Month Change
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Compared to{' '}
                  {new Date(
                    getPreviousMonth(selectedMonth) + '-01'
                  ).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  {isIncreased ? (
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
                        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  )}
                  <span
                    className={`text-2xl font-bold ${
                      isIncreased ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {isIncreased ? '+' : '-'}
                    {Math.abs(monthOverMonthChange).toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatCurrency(Math.abs(totalSpent - prevMonthTotal))}{' '}
                  {isIncreased ? 'more' : 'less'} than last month
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-300 pt-4 dark:border-gray-600">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Last Month
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(prevMonthTotal)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This Month
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="mb-8 grid gap-8 lg:grid-cols-2">
          {/* Category Breakdown */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Spending by Category
            </h2>
            <CategoryChart data={categoryChartData} />
          </div>

          {/* Spending Trend */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Daily Spending
            </h2>
            <SpendingTrendChart data={trendChartData} />
          </div>
        </div>

        {/* Budget Comparison */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Budget vs Actual
          </h2>
          <BudgetComparisonChart data={budgetComparisonData} />
        </div>

        {/* Spending Insights */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Spending Insights
          </h2>
          <div className="space-y-4">
            {/* Highest spending category */}
            {categoryChartData.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                  <svg
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Highest Spending
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>{categoryChartData[0].category}</strong> is your top
                    expense at{' '}
                    <strong>
                      {formatCurrency(categoryChartData[0].amount)}
                    </strong>
                  </p>
                </div>
              </div>
            )}

            {/* Budget status */}
            {budgets.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900/30">
                  <svg
                    className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Budget Status
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {budgetUsedPercentage > 100 ? (
                      <>
                        You&apos;ve exceeded your budget by{' '}
                        <strong className="text-red-600">
                          {formatCurrency(Math.abs(remainingBudget))}
                        </strong>
                      </>
                    ) : budgetUsedPercentage > 90 ? (
                      <>
                        You&apos;ve used{' '}
                        <strong className="text-yellow-600">
                          {budgetUsedPercentage.toFixed(1)}%
                        </strong>{' '}
                        of your budget
                      </>
                    ) : (
                      <>
                        You have{' '}
                        <strong className="text-green-600">
                          {formatCurrency(remainingBudget)}
                        </strong>{' '}
                        remaining in your budget
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Transaction insights */}
            {expenses.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                  <svg
                    className="h-5 w-5 text-purple-600 dark:text-purple-400"
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
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Transaction Average
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your average transaction is{' '}
                    <strong>{formatCurrency(avgTransaction)}</strong> across{' '}
                    <strong>{transactionCount} purchases</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {expenses.length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
                <p className="text-gray-500 dark:text-gray-400">
                  No expenses yet. Start tracking to see insights!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Recent Transactions
          </h2>
          <div className="space-y-3">
            {expenses.slice(0, 5).map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-800"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {expense.description || expense.category}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(expense.amount)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {expense.category}
                  </p>
                </div>
              </div>
            ))}
            {expenses.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No transactions yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
