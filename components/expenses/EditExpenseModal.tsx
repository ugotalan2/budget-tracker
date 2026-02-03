'use client';

import ExpenseForm from './ExpenseForm';
import { type Expense, type Category, type Account } from '@/lib/types';

type EditExpenseModalProps = {
  expense: Expense;
  accounts: Account[];
  onUpdate: (
    id: string,
    data: {
      amount: number;
      category: Category;
      description: string;
      date: string;
      account_id: string;
    }
  ) => Promise<void>;
  onClose: () => void;
};

export default function EditExpenseModal({
  expense,
  accounts,
  onUpdate,
  onClose,
}: EditExpenseModalProps) {
  const handleSubmit = async (expenseData: {
    amount: number;
    category: Category;
    description: string;
    date: string;
    account_id: string;
  }) => {
    try {
      await onUpdate(expense.id, expenseData);
      onClose();
    } catch (error) {
      //console.error('Failed to update:', error);
      throw error;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
        >
          ×
        </button>

        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Edit Expense
        </h2>

        <ExpenseForm
          onSubmit={handleSubmit}
          accounts={accounts}
          initialData={{
            amount: expense.amount,
            category: expense.category as Category,
            description: expense.description || '',
            date: expense.date,
            account_id: expense.account_id || '',
          }}
          isEditing={true}
        />
      </div>
    </div>
  );
}
