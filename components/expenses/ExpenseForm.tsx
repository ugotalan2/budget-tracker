'use client';

import { useState } from 'react';
import { CATEGORIES, Category } from '@/lib/types';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

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

  const categoryOptions = CATEGORIES.map((cat) => ({
    value: cat,
    label: cat,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <Input
        label="Amount"
        id="amount"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onFocus={(e) => e.target.select()}
        placeholder="0.00"
        prefix="$"
        required
      />

      <Select
        label="Category"
        id="category"
        value={category}
        onChange={(e) => setCategory(e.target.value as Category)}
        options={categoryOptions}
        required
      />

      <Input
        label="Date"
        id="date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <Input
        label="Description (optional)"
        id="description"
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="e.g., Groceries at Costco"
      />

      <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
        {isSubmitting
          ? 'Saving...'
          : isEditing
            ? 'Update Expense'
            : 'Add Expense'}
      </Button>
    </form>
  );
}
