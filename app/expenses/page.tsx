'use client';

import ExpenseForm from '@/components/expenses/ExpenseForm';
import { formatCurrency } from '@/lib/calculations';
import { createClient } from '@/lib/supabase/client';
import { Expense } from '@/lib/types';
import { useEffect, useState } from 'react';
import EditExpenseModal from '@/components/expenses/EditExpenseModal';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // fetch expenses
  const fetchExpenses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      // console.error('Error fetching expenses:', error);
    } else {
      setExpenses(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const loadExpenses = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        // console.error('Error fetching expenses:', error);
      } else {
        setExpenses(data || []);
      }
      setIsLoading(false);
    };

    loadExpenses();
    // Alternatively, just call fetchExpenses():
    // fetchExpenses();
  }, [supabase]);

  // Add expense
  const handleAddExpense = async (expenseData: {
    amount: number;
    category: string;
    description: string;
    date: string;
  }) => {
    // TEMPORARY: Use a test user ID for development
    const devUserId = '00000000-0000-0000-0000-000000000000';

    // const {
    // 	data: { user },
    // } = await supabase.auth.getUser();

    // if (!user) {
    // 	throw new Error('You must be logged in to add expenses.');
    // }

    const { error } = await supabase.from('expenses').insert({
      user_id: devUserId,
      ...expenseData,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Refresh list
    await fetchExpenses();
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
      // Refresh list
      await fetchExpenses();
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
    await fetchExpenses();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
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
          </div>

          {/* Expense List */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Recent Expenses
              </h2>

              {expenses.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No expenses yet. Add your first expense to get started!
                </p>
              ) : (
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
                          {new Date(expense.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingExpense(expense)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
    </div>
  );
}
