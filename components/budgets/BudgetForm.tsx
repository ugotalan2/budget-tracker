'use client';

import { useEffect, useState, useRef } from 'react';
import { CATEGORIES, type Category } from '@/lib/types';
import { generateMonthOptions } from '@/lib/dateUtils';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

type BudgetFormProps = {
  onSubmit: (budget: {
    category: Category;
    limit_amount: number;
    month: string;
  }) => Promise<void>;
  initialData?: {
    category: Category;
    limit_amount: number | '';
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
  const availableCategories = isEditing
    ? CATEGORIES
    : CATEGORIES.filter((category) => !existingCategories.includes(category));

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

  const categoryOptions = availableCategories.map((cat) => ({
    value: cat,
    label: cat,
  }));

  const monthOptions = generateMonthOptions().map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  // Update category when available categories change
  useEffect(() => {
    if (!isEditing && !initialData && availableCategories.length > 0) {
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

      setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
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
        month: month + '-01',
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
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <Select
        label="Category"
        id="category"
        value={category}
        onChange={(e) => setCategory(e.target.value as Category)}
        options={categoryOptions}
        disabled={isEditing}
        hint={
          !isEditing && availableCategories.length === 0
            ? 'All categories have budgets for this month'
            : undefined
        }
        required
      />

      <Select
        label={isEditing ? 'Month (locked)' : 'Month'}
        id="month"
        value={month}
        onChange={(e) => {
          const newMonth = e.target.value;
          setMonth(newMonth);
          if (!isEditing && onMonthChange) {
            onMonthChange(newMonth);
          }
        }}
        options={monthOptions}
        disabled={isEditing}
        required
      />

      <Input
        ref={amountInputRef}
        label="Budget Limit"
        id="limit"
        type="number"
        step="0.01"
        min="0"
        value={limitAmount}
        onChange={(e) => setLimitAmount(e.target.value)}
        onFocus={(e) => e.target.select()}
        placeholder="500.00"
        prefix="$"
        required
      />

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={isSubmitting || availableCategories.length === 0}
      >
        {isSubmitting
          ? 'Saving...'
          : isEditing
            ? 'Update Budget'
            : 'Set Budget'}
      </Button>
    </form>
  );
}
