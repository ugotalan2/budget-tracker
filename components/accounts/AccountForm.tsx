'use client';

import { useState } from 'react';
import { type Account, ACCOUNT_TYPES, ACCOUNT_COLORS } from '@/lib/types';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

type AccountFormProps = {
  initialData?: Account;
  onSubmit: (data: Partial<Account>) => Promise<void>;
  onCancel: () => void;
};

export default function AccountForm({
  initialData,
  onSubmit,
  onCancel,
}: AccountFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<Account['type']>(
    initialData?.type || 'checking'
  );
  const [isPrimary, setIsPrimary] = useState(initialData?.is_primary || false);
  const [isOnBudget, setIsOnBudget] = useState(
    initialData?.is_on_budget ?? true
  );
  const [trackBalance, setTrackBalance] = useState(
    initialData?.track_balance || false
  );
  const [currentBalance, setCurrentBalance] = useState(
    initialData?.current_balance?.toString() || ''
  );
  const [color, setColor] = useState(initialData?.color || '#3B82F6');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Account name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        type,
        is_primary: isPrimary,
        is_on_budget: isOnBudget,
        track_balance: trackBalance,
        current_balance: parseFloat(currentBalance) || 0,
        color,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
      {/* Hidden fake fields to trick browser autocomplete */}
      <div
        style={{
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
        }}
        aria-hidden="true"
      >
        <input
          type="text"
          name="fake_username"
          tabIndex={-1}
          autoComplete="username"
        />
        <input
          type="password"
          name="fake_password"
          tabIndex={-1}
          autoComplete="new-password"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <Input
        label="Account Name"
        id="account-name"
        name="account-name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Chase Checking, Amex Blue"
        autoComplete="off"
        autoFocus
        required
      />

      <Select
        label="Account Type"
        id="type"
        value={type}
        onChange={(e) => setType(e.target.value as Account['type'])}
        options={ACCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
      />

      {/* Color Picker */}
      <div>
        <label
          htmlFor="color"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Color
        </label>
        <div className="flex gap-2">
          {ACCOUNT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`h-10 w-10 rounded-lg transition-all ${
                color === c.value
                  ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800'
                  : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
          />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Set as primary account
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              This account will be auto-selected when adding expenses
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isOnBudget}
            onChange={(e) => setIsOnBudget(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
          />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Include in budget tracking
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Transactions from this account affect your budget
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={trackBalance}
            onChange={(e) => setTrackBalance(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
          />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Track balance
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Keep track of how much is in this account
            </div>
          </div>
        </label>
      </div>

      {/* Current Balance (only if tracking) */}
      {trackBalance && (
        <Input
          label="Current Balance"
          id="account-balance"
          name="account-balance"
          type="number"
          step="0.01"
          value={currentBalance}
          onChange={(e) => setCurrentBalance(e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder="0.00"
          prefix="$"
          autoComplete="off"
        />
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Saving...'
            : initialData
              ? 'Update Account'
              : 'Add Account'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
