'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { type Budget, type Expense, UserPreferences } from '@/lib/types';
import BudgetForm from '@/components/budgets/BudgetForm';
import { formatCurrency } from '@/lib/calculations';
import Select from '@/components/ui/Select';
import IconButton from '@/components/ui/IconButton';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useCategories } from '@/lib/hooks/useCategories';
import BudgetHierarchy from '@/components/budgets/BudgetHierarchy';
import { useAuth } from '@clerk/nextjs';
import { useToast } from '@/lib/contexts/ToastContext';
import {
  generateMonthOptions,
  getPreviousMonth,
  getNextMonth,
  getMonthBoundariesFromString,
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
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences | null>({
      auto_adjust_parent_budgets: true,
      user_id: userId || '',
    } as UserPreferences);
  const supabase = createClient();
  const formRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

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

  // Fetch preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!userId) return;

      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      setUserPreferences(
        data ||
          ({
            auto_adjust_parent_budgets: true,
            user_id: userId,
          } as UserPreferences)
      );
    };

    fetchPreferences();
  }, [userId, supabase]);

  // Fetch budgets for selected month
  const fetchBudgets = async (showLoader = true) => {
    if (!userId) return;

    if (showLoader) setIsLoading(true);

    const { start, end } = getMonthBoundariesFromString(selectedMonth);

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .gte('month', start)
      .lt('month', end)
      .eq('user_id', userId);

    if (!error && data) {
      setBudgets(data);
    }

    if (showLoader) setIsLoading(false);
  };

  // Fetch existing categories for a specific month (for the form)
  const fetchExistingCategoriesForMonth = async (month: string) => {
    const { start, end } = getMonthBoundariesFromString(month);

    const { data } = await supabase
      .from('budgets')
      .select('category_id')
      .eq('user_id', userId)
      .gte('month', start)
      .lt('month', end);

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
    if (!userId) return;

    const { start, end } = getMonthBoundariesFromString(selectedMonth);

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', start)
      .lt('date', end)
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
    if (!userId) return;

    fetchData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  // Calculate spending for each category (including children for parents)
  const getSpendingForCategory = (
    categoryId: string,
    includeChildren = false
  ) => {
    let spending = expenses
      .filter((expense) => expense.category_id === categoryId)
      .reduce((sum, expense) => sum + expense.amount, 0);

    // If this is a parent category, add children's spending
    if (includeChildren) {
      const category = categoriesHierarchy.find((p) => p.id === categoryId);
      if (category?.children) {
        category.children.forEach((child) => {
          spending += expenses
            .filter((expense) => expense.category_id === child.id)
            .reduce((sum, expense) => sum + expense.amount, 0);
        });
      }
    }

    return spending;
  };

  // Calculate budget status
  const getBudgetStatus = (budget: Budget) => {
    const category = categoriesHierarchy
      .flatMap((p) => [p, ...(p.children || [])])
      .find((c) => c.id === budget.category_id);

    // For parent categories, include children's spending
    const isParent = !category?.parent_id;
    const spent = getSpendingForCategory(budget.category_id || '', isParent);

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

      showToast(
        `You already have a ${categoryName} budget for ${formatMonthYear(targetMonth)}`,
        'error'
      );
      return;
    }

    const selectedCategory = categoriesHierarchy
      .flatMap((p) => [p, ...(p.children || [])])
      .find((c) => c.id === budgetData.category_id);

    const budgetsToInsert: Array<{
      user_id: string;
      category_id: string;
      limit_amount: number;
      month: string;
    }> = [];

    let parentBudgetUpdate: {
      id: string;
      newAmount: number;
      reason: string;
    } | null = null;

    // Check if this is a child and if parent needs adjustment
    if (selectedCategory?.parent_id) {
      const parentBudget = budgets.find(
        (b) => b.category_id === selectedCategory.parent_id
      );

      if (!parentBudget) {
        // No parent budget exists - create one
        budgetsToInsert.push({
          user_id: userId,
          category_id: selectedCategory.parent_id,
          limit_amount: budgetData.limit_amount * 2,
          month: budgetData.month,
        });
      } else if (userPreferences?.auto_adjust_parent_budgets) {
        // Parent exists - check if it needs to be increased
        const siblingBudgets = budgets.filter((b) => {
          const cat = categoriesHierarchy
            .flatMap((p) => [p, ...(p.children || [])])
            .find((c) => c.id === b.category_id);
          return cat?.parent_id === selectedCategory.parent_id;
        });

        const totalChildBudgets =
          siblingBudgets.reduce((sum, b) => sum + b.limit_amount, 0) +
          budgetData.limit_amount;

        if (totalChildBudgets > parentBudget.limit_amount) {
          // Need to increase parent budget
          parentBudgetUpdate = {
            id: parentBudget.id,
            newAmount: totalChildBudgets,
            reason: 'increased',
          };
        }
      }
    }

    // Add the requested budget
    budgetsToInsert.push({
      user_id: userId,
      category_id: budgetData.category_id,
      limit_amount: budgetData.limit_amount,
      month: budgetData.month,
    });

    // Insert new budgets
    if (budgetsToInsert.length > 0) {
      const { error } = await supabase.from('budgets').insert(budgetsToInsert);

      if (error) {
        if (error.code === '23505') {
          alert('A budget for this category already exists for this month.');
        } else {
          alert('Failed to create budget: ' + error.message);
        }
        return;
      }
    }

    // Update parent budget if needed
    if (parentBudgetUpdate) {
      const { error: updateError } = await supabase
        .from('budgets')
        .update({ limit_amount: parentBudgetUpdate.newAmount })
        .eq('id', parentBudgetUpdate.id)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Failed to update parent budget:', updateError);
      }

      const parentCategory = categoriesHierarchy.find(
        (p) => p.id === selectedCategory?.parent_id
      );
      showToast(
        `Parent budget for "${parentCategory?.name}" automatically ${parentBudgetUpdate.reason} to ${formatCurrency(parentBudgetUpdate.newAmount)}`,
        'success'
      );
    }

    // Refresh
    if (targetMonth === selectedMonth) {
      await fetchBudgets();
    }

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
    if (!userId) return;

    const budgetBeingEdited = budgets.find((b) => b.id === id);
    if (!budgetBeingEdited) return;

    const selectedCategory = categoriesHierarchy
      .flatMap((p) => [p, ...(p.children || [])])
      .find((c) => c.id === budgetData.category_id);

    let parentBudgetUpdate: {
      id: string;
      newAmount: number;
      reason: string;
    } | null = null;

    // Check if this is a child budget and auto-adjust is enabled
    if (
      selectedCategory?.parent_id &&
      userPreferences?.auto_adjust_parent_budgets
    ) {
      const parentBudget = budgets.find(
        (b) => b.category_id === selectedCategory.parent_id
      );

      if (parentBudget) {
        const siblingBudgets = budgets.filter((b) => {
          const cat = categoriesHierarchy
            .flatMap((p) => [p, ...(p.children || [])])
            .find((c) => c.id === b.category_id);
          return cat?.parent_id === selectedCategory.parent_id && b.id !== id; // Exclude the one being edited
        });

        const totalChildBudgets =
          siblingBudgets.reduce((sum, b) => sum + b.limit_amount, 0) +
          budgetData.limit_amount;

        if (totalChildBudgets > parentBudget.limit_amount) {
          // Need to INCREASE parent budget
          parentBudgetUpdate = {
            id: parentBudget.id,
            newAmount: totalChildBudgets,
            reason: 'increased',
          };
        } else if (totalChildBudgets < parentBudget.limit_amount) {
          // Check if parent equals sum of children (exact match before this change)
          const oldTotalChildren =
            siblingBudgets.reduce((sum, b) => sum + b.limit_amount, 0) +
            budgetBeingEdited.limit_amount;

          if (oldTotalChildren === parentBudget.limit_amount) {
            // Parent was exactly equal to sum - decrease it
            parentBudgetUpdate = {
              id: parentBudget.id,
              newAmount: totalChildBudgets,
              reason: 'decreased',
            };
          }
        }
      }
    }

    // Check if this is a parent budget being edited
    if (
      !selectedCategory?.parent_id &&
      userPreferences?.auto_adjust_parent_budgets
    ) {
      const childBudgets = budgets.filter((b) => {
        const cat = categoriesHierarchy
          .flatMap((p) => [p, ...(p.children || [])])
          .find((c) => c.id === b.category_id);
        return cat?.parent_id === budgetData.category_id;
      });

      const totalChildBudgets = childBudgets.reduce(
        (sum, b) => sum + b.limit_amount,
        0
      );

      if (budgetData.limit_amount < totalChildBudgets) {
        alert(
          `Parent budget (${formatCurrency(budgetData.limit_amount)}) cannot be less than the sum of child budgets (${formatCurrency(totalChildBudgets)}). Minimum required: ${formatCurrency(totalChildBudgets)}.`
        );
        return;
      }
    }

    // Update the budget
    const { error } = await supabase
      .from('budgets')
      .update({ limit_amount: budgetData.limit_amount })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      alert('Failed to update budget: ' + error.message);
      return;
    }

    // Update parent budget if needed
    if (parentBudgetUpdate) {
      const { error: updateError } = await supabase
        .from('budgets')
        .update({ limit_amount: parentBudgetUpdate.newAmount })
        .eq('id', parentBudgetUpdate.id)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Failed to update parent budget:', updateError);
      }

      const parentCategory = categoriesHierarchy.find(
        (p) => p.id === selectedCategory?.parent_id
      );
      showToast(
        `Parent budget for "${parentCategory?.name}" automatically ${parentBudgetUpdate.reason} to ${formatCurrency(parentBudgetUpdate.newAmount)}`,
        'success'
      );
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

  const handleCopyFromPreviousMonth = async () => {
    if (!userId) return;

    const previousMonth = getPreviousMonth(selectedMonth);
    const { start, end } = getMonthBoundariesFromString(previousMonth);

    // Fetch previous month's budgets
    const { data: prevBudgets, error: fetchError } = await supabase
      .from('budgets')
      .select('category_id, limit_amount')
      .eq('user_id', userId)
      .gte('month', start)
      .lt('month', end);

    if (fetchError || !prevBudgets || prevBudgets.length === 0) {
      alert('No budgets found from previous month to copy.');
      return;
    }

    // Create new budgets for selected month
    const newBudgets = prevBudgets.map(
      (budget: { category_id: string | null; limit_amount: number }) => ({
        user_id: userId,
        category_id: budget.category_id,
        limit_amount: budget.limit_amount,
        month: selectedMonth + '-01',
      })
    );

    const { error: insertError } = await supabase
      .from('budgets')
      .insert(newBudgets);

    if (insertError) {
      alert('Failed to copy budgets: ' + insertError.message);
      return;
    }

    // Refresh
    await fetchBudgets();
    await fetchExistingCategoriesForMonth(selectedMonth);
  };

  // Calculate overall stats
  const overallStats = {
    totalBudget: budgets
      .filter((budget) => {
        // Only count parent budgets
        const category = categoriesHierarchy
          .flatMap((p) => [p, ...(p.children || [])])
          .find((c) => c.id === budget.category_id);
        return !category?.parent_id; // Only parents
      })
      .reduce((sum, budget) => sum + budget.limit_amount, 0),

    totalSpent: budgets
      .filter((budget) => {
        // Only count parent budgets (they already roll up child spending)
        const category = categoriesHierarchy
          .flatMap((p) => [p, ...(p.children || [])])
          .find((c) => c.id === budget.category_id);
        return !category?.parent_id;
      })
      .reduce((sum, budget) => {
        const status = getBudgetStatus(budget);
        return sum + status.spent;
      }, 0),

    categoriesOverBudget: budgets.filter((budget) => {
      const category = categoriesHierarchy
        .flatMap((p) => [p, ...(p.children || [])])
        .find((c) => c.id === budget.category_id);
      return !category?.parent_id && getBudgetStatus(budget).isOverBudget;
    }).length,

    categoriesOnTrack: budgets.filter((budget) => {
      const category = categoriesHierarchy
        .flatMap((p) => [p, ...(p.children || [])])
        .find((c) => c.id === budget.category_id);
      const status = getBudgetStatus(budget);
      return (
        !category?.parent_id && !status.isOverBudget && status.percentage < 90
      );
    }).length,

    categoriesWarning: budgets.filter((budget) => {
      const category = categoriesHierarchy
        .flatMap((p) => [p, ...(p.children || [])])
        .find((c) => c.id === budget.category_id);
      const status = getBudgetStatus(budget);
      return (
        !category?.parent_id && !status.isOverBudget && status.percentage >= 90
      );
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
                existingBudgets={budgets
                  .filter(
                    (b): b is Budget & { category_id: string } =>
                      !!b.category_id
                  )
                  .map((b) => ({
                    category_id: b.category_id,
                    limit_amount: b.limit_amount,
                  }))}
                onMonthChange={handleFormMonthChange}
                defaultMonth={formMonth}
                autoAdjustEnabled={
                  userPreferences?.auto_adjust_parent_budgets ?? true
                }
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
                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-800">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    No budgets yet
                  </p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Set your first budget to start tracking your spending
                  </p>

                  {/* Show copy button if viewing future month */}
                  {selectedMonth >= new Date().toISOString().slice(0, 7) && (
                    <button
                      onClick={handleCopyFromPreviousMonth}
                      className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy budgets from{' '}
                      {formatMonthYear(getPreviousMonth(selectedMonth))}
                    </button>
                  )}
                </div>
              ) : (
                <BudgetHierarchy
                  budgets={budgets.map((budget) => ({
                    ...budget,
                    ...getBudgetStatus(budget),
                  }))}
                  categories={categoriesHierarchy.flatMap((p) => [
                    p,
                    ...(p.children || []),
                  ])}
                  categoryMap={categoryMap}
                  onEdit={handleEditClick}
                  onDelete={handleDelete}
                />
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
