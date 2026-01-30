'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
import { CATEGORIES, Expense } from '@/lib/types';
import { exportExpensesToCSV } from '@/lib/exportUtils';
import EditExpenseModal from '@/components/expenses/EditExpenseModal';
import ExpenseActionsMenu from '@/components/expenses/ExpenseActionsMenu';
import {
  generateMonthOptions,
  getPreviousMonth,
  getNextMonth,
  getMonthBoundariesFromString,
  formatMonthYear,
} from '@/lib/dateUtils';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const supabase = createClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // fetch expenses
  const fetchExpenses = useCallback(
    async (reset = false) => {
      setIsLoading(true);

      const currentOffset = reset ? 0 : offsetRef.current;

      let query = supabase.from('expenses').select('*');

      // Apply category filter
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
    [categoryFilter, sortBy, sortOrder, debouncedSearch, supabase]
  );

  // Fetch summary stats for current month
  const fetchSummary = useCallback(async () => {
    const { start, end } = getMonthBoundariesFromString(summaryMonth);

    const { data, error } = await supabase
      .from('expenses')
      .select('amount, category')
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
  }, [summaryMonth, supabase]);

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

  // Generate filter description for export menu
  const filterLabel = (() => {
    const parts: string[] = [];

    if (categoryFilter !== 'All') {
      parts.push(`${categoryFilter} expenses`);
    }

    if (debouncedSearch) {
      parts.push(`matching "${debouncedSearch}"`);
    }

    return parts.length > 0 ? parts.join(' ') : 'All expenses';
  })();

  // Add expense
  const handleAddExpense = async (expenseData: {
    amount: number;
    category: string;
    description: string;
    date: string;
  }) => {
    // TEMPORARY: Use a test user ID for development
    const devUserId = '00000000-0000-0000-0000-000000000000';

    const { error } = await supabase.from('expenses').insert({
      user_id: devUserId,
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
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) {
      // console.error('Error deleting expense:', error);
      alert('Failed to delete expense.');
    } else {
      // remove from local state
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
      await fetchSummary();
    }
  };

  // Update expense
  const handleUpdate = async (
    id: string,
    expenseData: {
      amount: number;
      category: string;
      description: string;
      date: string;
    }
  ) => {
    const { error } = await supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', id);

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
    let query = supabase.from('expenses').select('*');

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
      .order('date', { ascending: false });

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-2 text-gray-600">Track and manage your expenses</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Expense Form */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Add Expense
              </h2>
              <ExpenseForm onSubmit={handleAddExpense} />
            </div>

            {/* Expense Summary Card */}
            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              {/* Month/Year Display - Centered */}
              <div className="mb-2 text-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {summaryMonth === currentMonth
                    ? 'This Month'
                    : formatMonthYear(summaryMonth)}
                </h2>
              </div>

              {/* Navigation Controls - Centered, Fixed Width */}
              <div className="mb-6 flex items-center justify-center gap-2">
                <button
                  onClick={() =>
                    setSummaryMonth(getPreviousMonth(summaryMonth))
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                  title="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <select
                  value={summaryMonth}
                  onChange={(e) => setSummaryMonth(e.target.value)}
                  className="h-9 w-40 rounded-lg border border-gray-200 bg-white px-3 text-center text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {generateMonthOptions(12, 1).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setSummaryMonth(getNextMonth(summaryMonth))}
                  disabled={!canGoForward}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-500"
                  title="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Total spent card */}
              <div className="mb-4 rounded-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Spent
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {summaryStats.expenseCount} transaction
                      {summaryStats.expenseCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(summaryStats.totalSpent)}
                  </p>
                </div>
              </div>

              {/* Category breakdown */}
              {Object.keys(summaryStats.byCategory).length > 0 && (
                <div className="space-y-1.5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      By Category
                    </h3>
                    <button
                      onClick={() => {
                        // Export all expenses for this month
                        const monthExpenses = expenses.filter((exp) =>
                          exp.date.startsWith(summaryMonth)
                        );
                        exportExpensesToCSV(monthExpenses, {
                          month: summaryMonth,
                        });
                      }}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                    >
                      <Download className="h-3 w-3" />
                      Export Month
                    </button>
                  </div>
                  {Object.entries(summaryStats.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, amount]) => (
                      <div
                        key={category}
                        className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-700 transition-colors group-hover:text-gray-900">
                          {category}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Expense List */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search expenses..."
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Filters Row */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Expenses
                  </h2>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as 'date' | 'amount')
                      }
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="date">Sort by Date</option>
                      <option value="amount">Sort by Amount</option>
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(e.target.value as 'date' | 'amount')
                      }
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="date">Sort by Date</option>
                      <option value="amount">Sort by Amount</option>
                    </select>
                    <button
                      onClick={() =>
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      }
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                      title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    >
                      {sortOrder === 'asc' ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="All">All Categories</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {/* Three-dot menu */}
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
                  <p className="text-gray-500">
                    {searchQuery ? (
                      <>
                        No expenses found for &quot;{searchQuery}&quot;
                        <button
                          onClick={() => setSearchQuery('')}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          Clear search
                        </button>
                      </>
                    ) : categoryFilter === 'All' ? (
                      'No expenses yet. Add your first expense to get started!'
                    ) : (
                      `No ${categoryFilter} expenses found.`
                    )}
                  </p>
                </div>
              ) : (
                <>
                  {/* Show result count if searching */}
                  {searchQuery && (
                    <div className="mb-4 text-sm text-gray-600">
                      Found {expenses.length} result
                      {expenses.length !== 1 ? 's' : ''} for &quot;{searchQuery}
                      &quot;
                    </div>
                  )}

                  <div className="space-y-4">
                    {expenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                              {expense.category}
                            </span>
                            <span className="text-lg font-semibold text-gray-900">
                              {formatCurrency(expense.amount)}
                            </span>
                          </div>
                          {expense.description && (
                            <p className="mt-1 text-sm text-gray-600">
                              {expense.description}
                            </p>
                          )}
                          <p className="mt-1 text-sm text-gray-500">
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
                          <button
                            onClick={() => setEditingExpense(expense)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="text-sm font-medium text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load more indicator */}
                  {hasMore && (
                    <div ref={loadMoreRef} className="py-4 text-center">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                          <span className="text-sm text-gray-600">
                            Loading more...
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => fetchExpenses(false)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Load More
                        </button>
                      )}
                    </div>
                  )}

                  {!hasMore && expenses.length > 0 && (
                    <div className="py-4 text-center text-sm text-gray-500">
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
          onUpdate={handleUpdate}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </div>
  );
}
