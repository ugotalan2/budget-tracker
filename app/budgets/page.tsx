'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { type Budget, type Expense } from '@/lib/types';
import BudgetForm from '@/components/budgets/BudgetForm';
import BudgetProgress from '@/components/budgets/BudgetProgress';
import { formatCurrency } from '@/lib/calculations';
import Select from '@/components/ui/Select';
import IconButton from '@/components/ui/IconButton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useCategories } from '@/lib/hooks/useCategories';
import { useAuth } from '@clerk/nextjs';
import {
  generateMonthOptions,
  getPreviousMonth,
  getNextMonth,
} from '@/lib/dateUtils';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { categoriesHierarchy } = useCategories();
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formExistingCategories, setFormExistingCategories] = useState<
    string[]
  >([]);
  const [formMonth, setFormMonth] = useState(selectedMonth);

  const { userId } = useAuth();
  const supabase = createClient();
  const formRef = useRef<HTMLDivElement>(null);

  // Create category lookup map
  const categoryMap = useMemo(() => {
    const map = new Map<
      string,
      { name: string; color: string; parent?: string }
    >();

    categoriesHierarchy.forEach((parent) => {
      map.set(parent.id, { name: parent.name, color: parent.color });

      parent.children?.forEach((child) => {
        map.set(child.id, {
          name: child.name,
          color: child.color,
          parent: parent.name,
        });
      });
    });

    return map;
  }, [categoriesHierarchy]);

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
      .order('category')
      .eq('user_id', userId);

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
      .select('category_id')
      .eq('user_id', userId)
      .gte('month', monthStart)
      .lt('month', monthEnd);

    setFormExistingCategories(
      (data
        ?.map((budget: Budget) => budget.category_id)
        .filter(Boolean) as string[]) || []
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
      .lt('date', monthEnd)
      .eq('user_id', userId);

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
  const getSpendingForCategory = (categoryId: string) => {
    return expenses
      .filter((expense) => expense.category_id === categoryId)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  // Calculate budget status
  const getBudgetStatus = (budget: Budget) => {
    const spent = getSpendingForCategory(budget.category_id || '');
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
    category_id: string;
    limit_amount: number;
    month: string;
  }) => {
    if (!userId) return;

    const targetMonth = budgetData.month.slice(0, 7);

    if (formExistingCategories.includes(budgetData.category_id)) {
      const categoryName =
        categoriesHierarchy
          .flatMap((p) => [p, ...(p.children || [])])
          .find((c) => c.id === budgetData.category_id)?.name ||
        'this category';

      alert(
        `You already have a ${categoryName} budget for ${formatMonthYear(targetMonth)}. Delete it first or click Edit.`
      );
      return;
    }

    const { error } = await supabase.from('budgets').insert({
      user_id: userId,
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
      category_id: string;
      limit_amount: number;
      month: string;
    }
  ) => {
    const { error } = await supabase
      .from('budgets')
      .update({ limit_amount: budgetData.limit_amount })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      alert('Failed to update budget: ' + error.message);
      return;
    }

    setEditingBudget(null);
    await fetchBudgets();
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(id);
  };

  const confirmDeleteBudget = async () => {
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', confirmDelete)
      .eq('user_id', userId);

    if (error) {
      alert('Failed to delete budget.');
    } else {
      // Remove from local state instead of refetching
      setBudgets((prev) =>
        prev.filter((budget) => budget.id !== confirmDelete)
      );
      await fetchExistingCategoriesForMonth(formMonth);
    }

    setConfirmDelete(null);
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent dark:border-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading budgets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Loading Indicator */}
        {isNavigating && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="rounded-lg bg-blue-600 px-6 py-3 shadow-lg dark:bg-blue-300">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent dark:border-gray-800"></div>
                <span className="text-sm font-medium text-white dark:text-gray-800">
                  Loading...
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Budgets
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Set spending limits for each category
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form Column */}
          <div className="lg:col-span-1" ref={formRef}>
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {editingBudget ? 'Edit Budget' : 'Set Budget'}
              </h2>

              {editingBudget && (
                <div className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                  Editing budget for{' '}
                  <strong>
                    {categoryMap.get(editingBudget.category_id || '')?.name ||
                      'Unknown Category'}
                  </strong>
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
                        category_id: editingBudget.category_id || '',
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
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Monthly Budgets
                </h2>
                <div className="flex items-center gap-2">
                  <IconButton
                    icon={<ChevronLeft className="h-4 w-4" />}
                    onClick={() => {
                      setIsNavigating(true);
                      setSelectedMonth(getPreviousMonth(selectedMonth));
                    }}
                    disabled={isNavigating}
                  />
                  <div className="w-44">
                    <Select
                      value={selectedMonth}
                      onChange={(e) => {
                        setIsNavigating(true);
                        setSelectedMonth(e.target.value);
                      }}
                      disabled={isNavigating}
                      options={generateMonthOptions(12).map((opt) => ({
                        value: opt.value,
                        label: opt.label,
                      }))}
                    />
                  </div>
                  <IconButton
                    icon={<ChevronRight className="h-4 w-4" />}
                    onClick={() => {
                      setIsNavigating(true);
                      setSelectedMonth(getNextMonth(selectedMonth));
                    }}
                  />
                </div>
              </div>

              {/* Budget Summary */}
              {budgets.length > 0 && (
                <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-6 dark:border-blue-700 dark:bg-blue-900/20">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Monthly Summary
                  </h3>

                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Budget
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(overallStats.totalBudget)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Spent
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          overallStats.totalSpent > overallStats.totalBudget
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {formatCurrency(overallStats.totalSpent)}
                      </p>
                    </div>
                  </div>

                  {/* Overall Progress Bar */}
                  <div className="mb-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Overall Progress
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {overallPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
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
                    <div className="rounded-lg bg-green-100 dark:bg-green-800 p-2">
                      <p className="font-semibold text-green-800 dark:text-green-400">
                        {overallStats.categoriesOnTrack}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-300">
                        On Track
                      </p>
                    </div>
                    <div className="rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900/30">
                      <p className="font-semibold text-yellow-800 dark:text-yellow-400">
                        {overallStats.categoriesWarning}
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        Warning
                      </p>
                    </div>
                    <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
                      <p className="font-semibold text-red-800 dark:text-red-400">
                        {overallStats.categoriesOverBudget}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-300">
                        Over
                      </p>
                    </div>
                  </div>

                  {overallStats.totalSpent > overallStats.totalBudget && (
                    <div className="mt-4 rounded-md bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900/3 dark:text-red-400">
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
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
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
                    const categoryInfo = categoryMap.get(
                      budget.category_id || ''
                    );
                    const categoryName = categoryInfo
                      ? categoryInfo.parent
                        ? `${categoryInfo.parent} → ${categoryInfo.name}`
                        : categoryInfo.name
                      : 'Uncategorized';

                    return (
                      <div
                        key={budget.id}
                        className="relative rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow dark:border-gray-700"
                      >
                        <BudgetProgress
                          categoryId={budget.category_id || ''}
                          categoryName={categoryName}
                          limitAmount={budget.limit_amount}
                          spent={status.spent}
                          percentage={status.percentage}
                          isOverBudget={status.isOverBudget}
                          onEdit={() => handleEditClick(budget)}
                          onDelete={() => handleDelete(budget.id)}
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
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Budget"
        message="Are you sure you want to delete this budget? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteBudget}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
