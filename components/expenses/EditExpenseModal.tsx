'use client';

import ExpenseForm from './ExpenseForm';
import { type Expense, type Category } from '@/lib/types';

type EditExpenseModalProps = {
  expense: Expense;
  onUpdate: (
    id: string,
    data: {
      amount: number;
      category: Category;
      description: string;
      date: string;
    }
  ) => Promise<void>;
  onClose: () => void;
};

export default function EditExpenseModal({
  expense,
  onUpdate,
  onClose,
}: EditExpenseModalProps) {
  const handleSubmit = async (expenseData: {
    amount: number;
    category: Category;
    description: string;
    date: string;
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
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>

        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Edit Expense
        </h2>

        <ExpenseForm
          onSubmit={handleSubmit}
          initialData={{
            amount: expense.amount,
            category: expense.category as Category,
            description: expense.description || '',
            date: expense.date,
          }}
          isEditing={true}
        />
      </div>
    </div>
  );
}
