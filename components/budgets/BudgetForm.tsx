'use client';

import { useEffect, useState, useRef } from 'react';
import { CATEGORIES, type Category } from '@/lib/types';
import { generateMonthOptions } from '@/lib/dateUtils';

type BudgetFormProps = {
  onSubmit: (budget: {
    category: Category;
    limit_amount: number;
    month: string;
  }) => Promise<void>;
  initialData?: {
    category: Category;
    limit_amount: number | ''; // Allow empty string
    month: string;
  };
  isEditing?: boolean;
  existingCategories?: string[];
  onMonthChange?: (month: string) => void;
  defaultMonth?: string;
};

export default function BudgetForm({
  onSubmit,
  initialData,
  isEditing = false,
  existingCategories = [],
  onMonthChange,
  defaultMonth,
}: BudgetFormProps) {
  // Filter out categories that already have budgets (unless editing)
  const availableCategories = isEditing
    ? CATEGORIES
    : CATEGORIES.filter(
        (catategory) => !existingCategories.includes(catategory)
      );

  const [category, setCategory] = useState<Category>(
    initialData?.category || availableCategories[0] || 'Food'
  );
  const [limitAmount, setLimitAmount] = useState(
    initialData?.limit_amount ? initialData.limit_amount.toString() : ''
  );
  const [month, setMonth] = useState(
    initialData?.month || defaultMonth || new Date().toISOString().slice(0, 7)
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const amountInputRef = useRef<HTMLInputElement>(null);

  // update category when available categories change
  useEffect(() => {
    if (!isEditing && !initialData && availableCategories.length > 0) {
      // Set to first available if current category isn't available
      if (!availableCategories.includes(category)) {
        setCategory(availableCategories[0]);
      }
    }
  }, [availableCategories, isEditing, initialData, category]);

  // Update form when editing
  useEffect(() => {
    if (initialData && isEditing) {
      setCategory(initialData.category);
      setLimitAmount(
        initialData.limit_amount ? initialData.limit_amount.toString() : ''
      );
      setMonth(initialData.month);

      // Focus amount input after a small delay
      setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select(); // Also select the text for easy replacement
      }, 100);
    }
  }, [initialData, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!limitAmount || parseFloat(limitAmount) <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        category,
        limit_amount: parseFloat(limitAmount),
        month: month + '-01', // Store as first day of month
      });

      if (!isEditing) {
        setLimitAmount('');
        setMonth(new Date().toISOString().slice(0, 7));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
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
          htmlFor="category"
          className="block text-sm font-medium text-gray-700"
        >
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={isEditing}
          required
        >
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {!isEditing && availableCategories.length === 0 && (
          <p className="mt-1 text-sm text-gray-500">
            All categories have budgets for this month
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="month"
          className="block text-sm font-medium text-gray-700"
        >
          Month {isEditing && <span className="text-gray-500">(locked)</span>}
        </label>
        <select
          id="month"
          value={month}
          onChange={(e) => {
            const newMonth = e.target.value;
            setMonth(newMonth);
            // Fetch categories for new month (without changing display)
            if (!isEditing && onMonthChange) {
              onMonthChange(newMonth);
            }
          }}
          className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            isEditing ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          disabled={isEditing}
          required
        >
          {generateMonthOptions().map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="limit"
          className="block text-sm font-medium text-gray-700"
        >
          Budget Limit
        </label>
        <div className="relative mt-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            $
          </span>
          <input
            type="number"
            id="limit"
            step="0.01"
            min="0"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            onFocus={(e) => e.target.select()}
            className="block w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="500.00"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || availableCategories.length === 0}
        className="w-full rounded-md bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? 'Saving...'
          : isEditing
            ? 'Update Budget'
            : 'Set Budget'}
      </button>
    </form>
  );
}
