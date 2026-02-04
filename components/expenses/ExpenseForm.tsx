'use client';

import { useState, useEffect } from 'react';
import { type Account } from '@/lib/types';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useCategories } from '@/lib/hooks/useCategories';

type ExpenseFormProps = {
  onSubmit: (expense: {
    amount: number;
    category_id: string;
    description: string;
    date: string;
    account_id: string;
  }) => Promise<void>;
  initialData?: {
    amount: number;
    category_id: string;
    description: string;
    date: string;
    account_id: string;
  };
  isEditing?: boolean;
  accounts: Account[];
};

export default function ExpenseForm({
  onSubmit,
  initialData,
  isEditing = false,
  accounts,
}: ExpenseFormProps) {
  const { categoriesHierarchy, isLoading: categoriesLoading } = useCategories();
  const activeAccounts = accounts.filter((a) => a.is_active);
  const showAccountField = activeAccounts.length > 1;
  const defaultAccount =
    activeAccounts.length === 1
      ? activeAccounts[0].id
      : activeAccounts.find((a) => a.is_primary)?.id || '';
  const [accountId, setAccountId] = useState(
    initialData?.account_id || defaultAccount
  );
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '');
  const [description, setDescription] = useState(
    initialData?.description || ''
  );
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accountId && defaultAccount) {
      setAccountId(defaultAccount);
    }
  }, [defaultAccount, accountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (!categoryId) {
      setError('Please select a category');
    }

    if (!date) {
      setError('Please select a date.');
      return;
    }

    if (!accountId && activeAccounts.length > 0) {
      setError('Please select an account');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        amount: parseFloat(amount),
        category_id: categoryId,
        description: description.trim(),
        date,
        account_id: accountId,
      });

      if (!isEditing) {
        setAmount('');
        setCategoryId('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setAccountId(defaultAccount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build hierarchical options for select
  const categoryOptions = [
    { value: '', label: 'Select category...' },
    ...categoriesHierarchy.flatMap((parent) => [
      { value: parent.id, label: parent.name },
      ...(parent.children || []).map((child) => ({
        value: child.id,
        label: `  ↳ ${child.name}`, // Indent children
      })),
    ]),
  ];

  if (categoriesLoading) {
    return <div className="text-sm text-gray-500">Loading categories...</div>;
  }

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
        autoFocus
      />

      <Select
        label="Category"
        id="category"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={categoryOptions}
        required
      />

      {showAccountField && (
        <Select
          label="Account"
          id="account"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          options={activeAccounts.map((acc) => ({
            value: acc.id,
            label: acc.name,
          }))}
        />
      )}

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
