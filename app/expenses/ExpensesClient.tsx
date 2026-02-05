'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Download,
} from 'lucide-react';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import { formatCurrency } from '@/lib/calculations';
import { createClient } from '@/lib/supabase/client';
import { Expense, Account } from '@/lib/types';
import { exportExpensesToCSV } from '@/lib/exportUtils';
import EditExpenseModal from '@/components/expenses/EditExpenseModal';
import ExpenseActionsMenu from '@/components/expenses/ExpenseActionsMenu';
import ExpenseItemMenu from '@/components/expenses/ExpenseItemMenu';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Select from '@/components/ui/Select';
import IconButton from '@/components/ui/IconButton';
import SearchInput from '@/components/ui/SearchInput';
import { useCategories } from '@/lib/hooks/useCategories';
import { useAuth } from '@clerk/nextjs';
import {
  generateMonthOptions,
  getPreviousMonth,
  getNextMonth,
  getMonthBoundariesFromString,
  formatMonthYear,
} from '@/lib/dateUtils';
import {
  flattenCategories,
  createCategoryMap as createCategoryLookupMap,
} from '@/lib/categoryHelpers';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { categoriesHierarchy } = useCategories();
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [summaryStats, setSummaryStats] = useState({
    totalSpent: 0,
    expenseCount: 0,
    byCategory: {} as Record<string, number>,
  });
  const [summaryMonth, setSummaryMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const currentMonth = new Date().toISOString().slice(0, 7);
  const canGoForward = summaryMonth < currentMonth;
  // pagination state
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const LIMIT = 20; // Load 20 expenses at a time

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { userId } = useAuth();
  const supabase = createClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // fetch expenses
  const fetchExpenses = useCallback(
    async (reset = false) => {
      if (!userId) return;
      setIsLoading(true);

      const currentOffset = reset ? 0 : offsetRef.current;

      let query = supabase.from('expenses').select('*').eq('user_id', userId);

      // Apply category filter
      if (categoryFilter !== 'All') {
        query = query.eq('category_id', categoryFilter);
      }

      if (debouncedSearch.trim()) {
        query = query.ilike('description', `%${debouncedSearch}%`);
      }

      // Apply sorting
      const ascending = sortOrder === 'asc';
      if (sortBy === 'date') {
        query = query.order('date', { ascending });
      } else {
        query = query.order('amount', { ascending });
      }

      // Apply pagination
      query = query.range(currentOffset, currentOffset + LIMIT - 1);

      const { data, error } = await query;

      if (!error && data) {
        if (reset) {
          setExpenses(data || []);
          offsetRef.current = LIMIT;
        } else {
          setExpenses((prev) => [...prev, ...(data || [])]);
          offsetRef.current += LIMIT;
        }

        // check if there are more expenses
        setHasMore(data.length === LIMIT);
      }

      setIsLoading(false);
    },
    [categoryFilter, sortBy, sortOrder, debouncedSearch, supabase, userId]
  );

  // Fetch accounts
  const fetchAccounts = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('sort_order');

    if (data) {
      setAccounts(data);
    }
  };

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Fetch summary stats for current month
  const fetchSummary = useCallback(async () => {
    if (!userId) return;

    const { start, end } = getMonthBoundariesFromString(summaryMonth);

    const { data, error } = await supabase
      .from('expenses')
      .select('amount, category_id')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end);

    if (!error && data) {
      const totalSpent = data.reduce(
        (sum: number, expense: Expense) => sum + expense.amount,
        0
      );
      const byCategory = data.reduce(
        (categories: Record<string, number>, expense: Expense) => {
          categories[expense.category] =
            (categories[expense.category] || 0) + expense.amount;
          return categories;
        },
        {} as Record<string, number>
      );

      setSummaryStats({
        totalSpent,
        expenseCount: data.length,
        byCategory,
      });
    }
  }, [summaryMonth, supabase, userId]);

  // Initial load
  useEffect(() => {
    fetchExpenses(true);
    fetchSummary();
  }, [fetchExpenses, fetchSummary]);

  // reset when filters/sort/search change
  useEffect(() => {
    offsetRef.current = 0;
    fetchExpenses(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, sortBy, sortOrder, searchQuery, fetchExpenses]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || isLoading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchExpenses(false);
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [isLoading, hasMore, fetchExpenses]);

  // Reset when month changes
  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryMonth, fetchSummary]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const allCategories = useMemo(
    () => flattenCategories(categoriesHierarchy),
    [categoriesHierarchy]
  );

  // Generate filter description for export menu
  const filterLabel = (() => {
    const parts: string[] = [];

    if (categoryFilter !== 'All') {
      const selectedCategory = allCategories.find(
        (c) => c.id === categoryFilter
      );

      if (selectedCategory) {
        parts.push(`${selectedCategory.name} expenses`);
      }
    }

    if (debouncedSearch) {
      parts.push(`matching "${debouncedSearch}"`);
    }

    return parts.length > 0 ? parts.join(' ') : 'All expenses';
  })();

  // Create a category lookup map
  const categoryMap = useMemo(() => {
    return createCategoryLookupMap(categoriesHierarchy);
  }, [categoriesHierarchy]);

  // Add expense
  const handleAddExpense = async (expenseData: {
    amount: number;
    category_id: string;
    description: string;
    date: string;
  }) => {
    if (!userId) return;

    const { error } = await supabase.from('expenses').insert({
      user_id: userId,
      ...expenseData,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Refresh list
    await fetchExpenses(true);
    await fetchSummary();
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(id);
  };

  const confirmDeleteExpense = async () => {
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', confirmDelete)
      .eq('user_id', userId);

    if (error) {
      alert('Failed to delete expense.');
    } else {
      setExpenses((prev) =>
        prev.filter((expense) => expense.id !== confirmDelete)
      );
      await fetchSummary();
    }

    setConfirmDelete(null);
  };

  // Update expense
  const handleUpdate = async (
    id: string,
    expenseData: {
      amount: number;
      category_id: string;
      description: string;
      date: string;
      account_id: string;
    }
  ) => {
    const { error } = await supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    // Refresh list
    await fetchExpenses(true);
    await fetchSummary();
  };

  // Export visible expenses
  const handleExportVisible = () => {
    exportExpensesToCSV(expenses, {
      category: categoryFilter !== 'All' ? categoryFilter : undefined,
      label: 'visible',
    });
  };

  // Export all matching expenses (fetch without pagination)
  const handleExportAll = async () => {
    let query = supabase.from('expenses').select('*').eq('user_id', userId);

    // Apply same filters as current view
    if (categoryFilter !== 'All') {
      query = query.eq('category', categoryFilter);
    }

    if (debouncedSearch.trim()) {
      query = query.ilike('description', `%${debouncedSearch}%`);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    if (sortBy === 'date') {
      query = query.order('date', { ascending });
    } else {
      query = query.order('amount', { ascending });
    }

    const { data, error } = await query;

    if (error) {
      alert('Failed to fetch expenses for export');
      return;
    }

    if (!data || data.length === 0) {
      alert('No expenses to export');
      return;
    }

    exportExpensesToCSV(data, {
      category: categoryFilter !== 'All' ? categoryFilter : undefined,
      label: 'all',
    });
  };

  // Export current month
  const handleExportMonth = async () => {
    const { start, end } = getMonthBoundariesFromString(summaryMonth);

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })
      .eq('user_id', userId);

    if (error) {
      alert('Failed to fetch expenses for export');
      return;
    }

    if (!data || data.length === 0) {
      alert('No expenses to export for this month');
      return;
    }

    exportExpensesToCSV(data, {
      month: summaryMonth,
    });
  };

  if (isLoading && expenses.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading expenses...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Expenses
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track and manage your expenses
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Expense Form */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Add Expense
              </h2>
              <ExpenseForm onSubmit={handleAddExpense} accounts={accounts} />
            </div>

            {/* Expense Summary Card */}
            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              {/* Month/Year Display */}
              <div className="mb-2 text-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {summaryMonth === currentMonth
                    ? 'This Month'
                    : formatMonthYear(summaryMonth)}
                </h2>
              </div>

              {/* Navigation Controls */}
              <div className="mb-6 flex items-center justify-center gap-2">
                <IconButton
                  icon={<ChevronLeft className="h-4 w-4" />}
                  onClick={() =>
                    setSummaryMonth(getPreviousMonth(summaryMonth))
                  }
                  title="Previous month"
                />
                <div className="w-44">
                  <Select
                    value={summaryMonth}
                    onChange={(e) => setSummaryMonth(e.target.value)}
                    options={generateMonthOptions(12, 1).map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    className="w-40 text-center"
                  />
                </div>
                <IconButton
                  icon={<ChevronRight className="h-4 w-4" />}
                  onClick={() => setSummaryMonth(getNextMonth(summaryMonth))}
                  disabled={!canGoForward}
                  title="Next month"
                />
              </div>

              {/* Total spent card */}
              <div className="mb-4 rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-5 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Spent
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-00">
                      {summaryStats.expenseCount} transaction
                      {summaryStats.expenseCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summaryStats.totalSpent)}
                  </p>
                </div>
              </div>

              {/* Category breakdown */}
              {Object.keys(summaryStats.byCategory).length > 0 && (
                <div className="space-y-1.5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500">
                      By Category
                    </h3>
                    <button
                      onClick={handleExportMonth}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      <Download className="h-3 w-3" />
                      Export Month
                    </button>
                  </div>
                  {Object.entries(summaryStats.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([categoryId, amount]) => {
                      const categoryInfo = categoryMap.get(categoryId);
                      const displayName = categoryInfo
                        ? categoryInfo.parent
                          ? `${categoryInfo.parent} → ${categoryInfo.name}`
                          : categoryInfo.name
                        : 'Uncategorized';

                      return (
                        <div
                          key={categoryId}
                          className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <span className="font-medium text-gray-700 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-white">
                            {displayName}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(amount)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Expense List */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                {/* Search Bar */}
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search expenses..."
                />

                {/* Filters Row */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Expenses
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="w-44">
                      <Select
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(e.target.value as 'date' | 'amount')
                        }
                        options={[
                          { value: 'date', label: 'Sort by Date' },
                          { value: 'amount', label: 'Sort by Amount' },
                        ]}
                      />
                    </div>
                    <IconButton
                      icon={
                        sortOrder === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      }
                      onClick={() =>
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      }
                      title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    />
                    {/* Category Filter Dropdown */}
                    <div className="w-44">
                      <Select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        options={[
                          { value: 'All', label: 'All Categories' },
                          ...categoriesHierarchy.flatMap((parent) => [
                            { value: parent.id, label: parent.name },
                            ...(parent.children || []).map((child) => ({
                              value: child.id,
                              label: `  ↳ ${child.name}`,
                            })),
                          ]),
                        ]}
                      />
                    </div>
                    {/* Three-dot menu stays as-is */}
                    <ExpenseActionsMenu
                      onExportVisible={handleExportVisible}
                      onExportAll={handleExportAll}
                      onExportMonth={handleExportMonth}
                      visibleCount={expenses.length}
                      monthLabel={
                        summaryMonth === currentMonth
                          ? 'This month'
                          : formatMonthYear(summaryMonth)
                      }
                      filterLabel={filterLabel}
                    />
                  </div>
                </div>
              </div>

              {/* Expense List Content */}
              {expenses.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-500  dark:text-gray-400">
                    {searchQuery ? (
                      <>
                        No expenses found for &quot;{searchQuery}&quot;
                        <button
                          onClick={() => setSearchQuery('')}
                          className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Clear search
                        </button>
                      </>
                    ) : categoryFilter === 'All' ? (
                      'No expenses yet. Add your first expense to get started!'
                    ) : (
                      <>
                        No{' '}
                        {allCategories.find((c) => c.id === categoryFilter)
                          ?.name || ''}{' '}
                        expenses found.
                      </>
                    )}
                  </p>
                </div>
              ) : (
                <>
                  {/* Show result count if searching */}
                  {searchQuery && (
                    <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                      Found {expenses.length} result
                      {expenses.length !== 1 ? 's' : ''} for &quot;{searchQuery}
                      &quot;
                    </div>
                  )}

                  <div className="space-y-4">
                    {expenses.map((expense) => {
                      const categoryInfo = categoryMap.get(
                        expense.category_id || ''
                      );

                      return (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0 dark:border-gray-700"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              {categoryInfo ? (
                                <>
                                  <span
                                    className="rounded-full px-3 py-1 text-sm font-medium"
                                    style={{
                                      backgroundColor: `${categoryInfo.color}20`,
                                      color: categoryInfo.color,
                                    }}
                                  >
                                    {categoryInfo.parent
                                      ? `${categoryInfo.parent} → ${categoryInfo.name}` // Show hierarchy
                                      : categoryInfo.name}
                                  </span>
                                </>
                              ) : (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                  Uncategorized
                                </span>
                              )}
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(expense.amount)}
                              </span>
                            </div>
                            {expense.description && (
                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {expense.description}
                              </p>
                            )}
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                              {new Date(expense.date).toLocaleDateString(
                                'en-US',
                                {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                }
                              )}
                            </p>
                          </div>
                          <div className="ml-4 flex gap-2">
                            <ExpenseItemMenu
                              onEdit={() => setEditingExpense(expense)}
                              onDelete={() => handleDelete(expense.id)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Load more indicator */}
                  {hasMore && (
                    <div ref={loadMoreRef} className="py-4 text-center">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Loading more...
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => fetchExpenses(false)}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Load More
                        </button>
                      )}
                    </div>
                  )}

                  {!hasMore && expenses.length > 0 && (
                    <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No more expenses
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          accounts={accounts}
          onUpdate={handleUpdate}
          onClose={() => setEditingExpense(null)}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteExpense}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
