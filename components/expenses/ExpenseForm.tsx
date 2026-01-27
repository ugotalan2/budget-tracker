'use client';

import { useState } from 'react';
import { CATEGORIES, Category } from '@/lib/types';

type ExpenseFormProps = {
  onSubmit: (expense: {
    amount: number;
    category: Category;
    description: string;
    date: string;
  }) => Promise<void>;
  initialData?: {
    amount: number;
    category: Category;
    description: string;
    date: string;
  };
  isEditing?: boolean;
};

export default function ExpenseForm({
  onSubmit,
  initialData,
  isEditing = false,
}: ExpenseFormProps) {
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [category, setCategory] = useState<Category>(
    initialData?.category || 'Food'
  );
  const [description, setDescription] = useState(
    initialData?.description || ''
  );
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    //Validation
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (!date) {
      setError('Please select a date.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        amount: parseFloat(amount),
        category,
        description,
        date,
      });

      // Reset form if not editing
      if (!isEditing) {
        setAmount('');
        setCategory('Food');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700"
        >
          Amount
        </label>
        <div className="relative mt-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            $
          </span>
          <input
            type="number"
            id="amount"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700"
        >
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="date"
          className="block text-sm font-medium text-gray-700"
        >
          Date
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description (optional)
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g., Groceries at Costco"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting
          ? 'Saving...'
          : isEditing
            ? 'Update Expense'
            : 'Add Expense'}
      </button>
    </form>
  );
}
