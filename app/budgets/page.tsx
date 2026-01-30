'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Category, type Budget, type Expense } from '@/lib/types';
import BudgetForm from '@/components/budgets/BudgetForm';
import BudgetProgress from '@/components/budgets/BudgetProgress';
import { formatCurrency } from '@/lib/calculations';
import {
  generateMonthOptions,
  getPreviousMonth,
  getNextMonth,
} from '@/lib/dateUtils';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formExistingCategories, setFormExistingCategories] = useState<
    Category[]
  >([]);
  const [formMonth, setFormMonth] = useState(selectedMonth);
  const supabase = createClient();
  const formRef = useRef<HTMLDivElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch budgets for selected month
  const fetchBudgets = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);

    const monthStart = selectedMonth + '-01';

    // Get first day of NEXT month for proper range
    const nextMonth = new Date(selectedMonth + '-01');
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthEnd = nextMonth.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .gte('month', monthStart)
      .lt('month', monthEnd)
      .order('category');

    if (!error && data) {
      setBudgets(data);
    }

    if (showLoader) setIsLoading(false);
  };

  // Fetch existing categories for a specific month (for the form)
  const fetchExistingCategoriesForMonth = async (month: string) => {
    const monthStart = month + '-01';
    const nextMonth = new Date(month + '-01');
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthEnd = nextMonth.toISOString().slice(0, 10);

    const { data } = await supabase
      .from('budgets')
      .select('category')
      .gte('month', monthStart)
      .lt('month', monthEnd);

    setFormExistingCategories(
      data?.map((budget: Budget) => budget.category) || []
    );
  };

  // Initialize form categories and month when editing changes
  useEffect(() => {
    if (!editingBudget) {
      setFormMonth(selectedMonth);
      fetchExistingCategoriesForMonth(selectedMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingBudget, selectedMonth]);

  // handle form month change
  const handleFormMonthChange = async (newMonth: string) => {
    setFormMonth(newMonth);
    await fetchExistingCategoriesForMonth(newMonth);
  };

  // Fetch expenses for selected month
  const fetchExpenses = async () => {
    const monthStart = selectedMonth + '-01';
    const nextMonth = new Date(selectedMonth + '-01');
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthEnd = nextMonth.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', monthStart)
      .lt('date', monthEnd);

    if (!error && data) {
      setExpenses(data);
    }
  };

  const fetchData = async (isMonthChange = false) => {
    if (isMonthChange) {
      setIsNavigating(true);
    } else {
      setIsLoading(true);
    }

    await Promise.all([fetchBudgets(false), fetchExpenses()]);

    setIsLoading(false);
    setIsNavigating(false);
  };

  useEffect(() => {
    fetchData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  // Calculate spending for each category
  const getSpendingForCategory = (category: string) => {
    return expenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  // Calculate budget status
  const getBudgetStatus = (budget: Budget) => {
    const spent = getSpendingForCategory(budget.category);
    const remaining = budget.limit_amount - spent;
    const percentage = (spent / budget.limit_amount) * 100;
    const isOverBudget = spent > budget.limit_amount;

    return {
      spent,
      remaining,
      percentage: Math.min(percentage, 100),
      isOverBudget,
    };
  };

  // helper to format yyyy-mm to Month Year w/o timezone issues
  const formatMonthYear = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Add budget
  const handleAddBudget = async (budgetData: {
    category: string;
    limit_amount: number;
    month: string;
  }) => {
    const devUserId = '00000000-0000-0000-0000-000000000000';
    const targetMonth = budgetData.month.slice(0, 7);

    if (formExistingCategories.includes(budgetData.category as Category)) {
      alert(
        `You already have a ${budgetData.category} budget for ${formatMonthYear(targetMonth)}. Delete it first or click Edit.`
      );
      return;
    }

    const { error } = await supabase.from('budgets').insert({
      user_id: devUserId,
      ...budgetData,
    });

    if (error) {
      if (error.code === '23505') {
        alert('A budget for this category already exists for this month.');
      } else {
        alert('Failed to create budget: ' + error.message);
      }
      return;
    }

    // Refresh display if we added to the currently displayed month
    if (targetMonth === selectedMonth) {
      await fetchBudgets();
    }

    // Refresh form categories for the form's current month
    await fetchExistingCategoriesForMonth(targetMonth);
  };

  // Update budget
  const handleUpdateBudget = async (
    id: string,
    budgetData: {
      category: string;
      limit_amount: number;
      month: string;
    }
  ) => {
    const { error } = await supabase
      .from('budgets')
      .update({ limit_amount: budgetData.limit_amount })
      .eq('id', id);

    if (error) {
      alert('Failed to update budget: ' + error.message);
      return;
    }

    setEditingBudget(null);
    await fetchBudgets();
  };

  // Delete budget
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    // If we're editing this budget, cancel edit mode first
    if (editingBudget?.id === id) {
      setEditingBudget(null);
    }

    setDeletingId(id);

    const { error } = await supabase.from('budgets').delete().eq('id', id);

    if (error) {
      alert('Failed to delete budget');
      setDeletingId(null);
    } else {
      // Remove from local state instead of refetching
      setBudgets(budgets.filter((b) => b.id !== id));
      // Update form categories
      await fetchExistingCategoriesForMonth(formMonth);
      setDeletingId(null);
    }
  };

  // Calculate overall stats
  const overallStats = {
    totalBudget: budgets.reduce((sum, budget) => sum + budget.limit_amount, 0),
    totalSpent: budgets.reduce((sum, budget) => {
      const status = getBudgetStatus(budget);
      return sum + status.spent;
    }, 0),
    categoriesOverBudget: budgets.filter(
      (budget) => getBudgetStatus(budget).isOverBudget
    ).length,
    categoriesOnTrack: budgets.filter((budget) => {
      const status = getBudgetStatus(budget);
      return !status.isOverBudget && status.percentage < 90;
    }).length,
    categoriesWarning: budgets.filter((budget) => {
      const status = getBudgetStatus(budget);
      return !status.isOverBudget && status.percentage >= 90;
    }).length,
  };

  const overallPercentage =
    overallStats.totalBudget > 0
      ? (overallStats.totalSpent / overallStats.totalBudget) * 100
      : 0;

  // Update the editing state setter
  const handleEditClick = (budget: Budget) => {
    setEditingBudget(budget);

    // Scroll to form smoothly
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  if (isLoading && !isNavigating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600">Loading budgets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Loading Indicator */}
        {isNavigating && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="rounded-lg bg-blue-600 px-6 py-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                <span className="text-sm font-medium text-white">
                  Loading...
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
          <p className="mt-2 text-gray-600">
            Set spending limits for each category
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form Column */}
          <div className="lg:col-span-1" ref={formRef}>
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                {editingBudget ? 'Edit Budget' : 'Set Budget'}
              </h2>

              {editingBudget && (
                <div className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                  Editing budget for <strong>{editingBudget.category}</strong>
                  <button
                    onClick={() => setEditingBudget(null)}
                    className="ml-2 font-medium underline"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <BudgetForm
                key={editingBudget ? `edit-${editingBudget.id}` : 'add-budget'}
                onSubmit={
                  editingBudget
                    ? (data) => handleUpdateBudget(editingBudget.id, data)
                    : handleAddBudget
                }
                initialData={
                  editingBudget
                    ? {
                        category: editingBudget.category as Category,
                        limit_amount: editingBudget.limit_amount,
                        month: editingBudget.month.slice(0, 7),
                      }
                    : undefined // Changed this
                }
                isEditing={!!editingBudget}
                existingCategories={formExistingCategories}
                onMonthChange={handleFormMonthChange}
                defaultMonth={formMonth}
              />
            </div>
          </div>

          {/* List Column */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Monthly Budgets
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsNavigating(true);
                      setSelectedMonth(getPreviousMonth(selectedMonth));
                    }}
                    disabled={isNavigating}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    {isNavigating ? '...' : '← Prev'}
                  </button>

                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      setIsNavigating(true);
                      setSelectedMonth(e.target.value);
                    }}
                    disabled={isNavigating}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {generateMonthOptions(12).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setIsNavigating(true);
                      setSelectedMonth(getNextMonth(selectedMonth));
                    }}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    {isNavigating ? '...' : 'Next →'}
                  </button>
                </div>
              </div>

              {/* Budget Summary */}
              {budgets.length > 0 && (
                <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    Monthly Summary
                  </h3>

                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Budget</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(overallStats.totalBudget)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p
                        className={`text-2xl font-bold ${
                          overallStats.totalSpent > overallStats.totalBudget
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {formatCurrency(overallStats.totalSpent)}
                      </p>
                    </div>
                  </div>

                  {/* Overall Progress Bar */}
                  <div className="mb-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-gray-600">Overall Progress</span>
                      <span className="font-medium text-gray-900">
                        {overallPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full transition-all duration-300 ${
                          overallPercentage > 100
                            ? 'bg-red-500'
                            : overallPercentage >= 90
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(overallPercentage, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Category Status */}
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-lg bg-green-100 p-2">
                      <p className="font-semibold text-green-800">
                        {overallStats.categoriesOnTrack}
                      </p>
                      <p className="text-xs text-green-600">On Track</p>
                    </div>
                    <div className="rounded-lg bg-yellow-100 p-2">
                      <p className="font-semibold text-yellow-800">
                        {overallStats.categoriesWarning}
                      </p>
                      <p className="text-xs text-yellow-600">Warning</p>
                    </div>
                    <div className="rounded-lg bg-red-100 p-2">
                      <p className="font-semibold text-red-800">
                        {overallStats.categoriesOverBudget}
                      </p>
                      <p className="text-xs text-red-600">Over</p>
                    </div>
                  </div>

                  {overallStats.totalSpent > overallStats.totalBudget && (
                    <div className="mt-4 rounded-md bg-red-100 p-3 text-sm text-red-800">
                      ⚠️ You&apos;re{' '}
                      {formatCurrency(
                        overallStats.totalSpent - overallStats.totalBudget
                      )}{' '}
                      over your total budget this month!
                    </div>
                  )}
                </div>
              )}

              {/* Budget List */}
              {budgets.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                  <p className="text-lg font-medium text-gray-900">
                    No budgets for this month
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Set your first budget to start tracking spending
                  </p>
                </div>
              ) : (
                <div className="space-y-">
                  {budgets.map((budget) => {
                    const status = getBudgetStatus(budget);
                    return (
                      <div
                        key={budget.id}
                        className="relative rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <BudgetProgress
                          category={budget.category}
                          limitAmount={budget.limit_amount}
                          spent={status.spent}
                          percentage={status.percentage}
                          isOverBudget={status.isOverBudget}
                          onEdit={() => handleEditClick(budget)}
                          onDelete={() => handleDelete(budget.id)}
                          className={
                            deletingId === budget.id ? 'opacity-50 ' : ''
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
