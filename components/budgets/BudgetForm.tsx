'use client';

import { useEffect, useState, useRef } from 'react';
import { generateMonthOptions } from '@/lib/dateUtils';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useCategories } from '@/lib/hooks/useCategories';

type BudgetFormProps = {
  onSubmit: (budget: {
    category_id: string;
    limit_amount: number;
    month: string;
  }) => Promise<void>;
  initialData?: {
    category_id: string;
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
  const { categoriesHierarchy, isLoading: categoriesLoading } = useCategories();
  const [categoryId, setCategoryId] = useState<string>(
    initialData?.category_id || ''
  );
  const [limitAmount, setLimitAmount] = useState(
    initialData?.limit_amount ? initialData.limit_amount.toString() : ''
  );
  const [month, setMonth] = useState(
    initialData?.month || defaultMonth || new Date().toISOString().slice(0, 7)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Build available categories (not already budgeted)
  const availableCategories = categoriesHierarchy
    .flatMap((parent) => [parent, ...(parent.children || [])])
    .filter(
      (cat) =>
        !existingCategories.includes(cat.id) ||
        cat.id === initialData?.category_id
    );

  const amountInputRef = useRef<HTMLInputElement>(null);

  const monthOptions = generateMonthOptions().map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  // Update category when available categories change
  useEffect(() => {
    if (!isEditing && !initialData && availableCategories.length > 0) {
      const categoryExists = availableCategories.some(
        (c) => c.id === categoryId
      );
      if (categoryExists) {
        setCategoryId(availableCategories[0].id);
      }
    }
  }, [availableCategories, isEditing, initialData, categoryId]);

  // Update form when editing
  useEffect(() => {
    if (initialData && isEditing) {
      setCategoryId(initialData.category_id);
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

    const parsedAmount = parseFloat(limitAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }

    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        category_id: categoryId,
        limit_amount: parseFloat(limitAmount),
        month: month + '-01',
      });

      if (!isEditing) {
        setLimitAmount('');
        setMonth(new Date().toISOString().slice(0, 7));
        if (availableCategories.length > 1) {
          setCategoryId(availableCategories[1].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (categoriesLoading) {
    return <div className="text-sm text-gray-500">Loading categories...</div>;
  }

  // Build hierarchical options
  const categoryOptions = availableCategories.map((cat) => {
    // Check if it's a child by seeing if any parent has this as a child
    const isChild = categoriesHierarchy.some((p) =>
      p.children?.some((c) => c.id === cat.id)
    );

    return {
      value: cat.id,
      label: isChild ? `  ↳ ${cat.name}` : cat.name,
    };
  });

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
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
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
