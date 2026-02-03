'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';
import { type Account, ACCOUNT_TYPES } from '@/lib/types';
import { Plus, Star, GripVertical } from 'lucide-react';
import Button from '@/components/ui/Button';
import AccountForm from '@/components/accounts/AccountForm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AccountItemMenu from '@/components/accounts/AccountItemMenu';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableAccountCard({
  account,
  onEdit,
  onDelete,
  onSetPrimary,
}: {
  account: Account;
  onEdit: () => void;
  onDelete: () => void;
  onSetPrimary: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab pt-2 text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:text-gray-500 dark:hover:text-gray-400"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Color indicator */}
          <div
            className="h-12 w-12 rounded-lg"
            style={{ backgroundColor: account.color }}
          />

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {account.name}
              </h3>
              {account.is_primary && (
                <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  <Star className="h-3 w-3" />
                  Primary
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {ACCOUNT_TYPES.find((t) => t.value === account.type)?.label}
            </p>

            {/* Settings badges */}
            <div className="mt-2 flex gap-2">
              {account.is_on_budget && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  On Budget
                </span>
              )}
              {account.track_balance && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Tracking Balance
                </span>
              )}
            </div>

            {/* Balance */}
            {account.track_balance && (
              <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                ${account.current_balance.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Three-dot menu */}
        <AccountItemMenu
          onEdit={onEdit}
          onDelete={onDelete}
          onSetPrimary={onSetPrimary}
          isPrimary={account.is_primary}
        />
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const { userId } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchAccounts = async () => {
    if (!userId) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!error && data) {
      setAccounts(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = accounts.findIndex((a) => a.id === active.id);
    const newIndex = accounts.findIndex((a) => a.id === over.id);

    const newAccounts = arrayMove(accounts, oldIndex, newIndex);
    setAccounts(newAccounts);

    // Update sort_order in database
    const updates = newAccounts.map((account, index) => ({
      id: account.id,
      sort_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from('accounts')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
        .eq('user_id', userId);
    }
  };

  const handleAddAccount = async (accountData: Partial<Account>) => {
    if (!userId) return;

    // Validate required fields
    if (!accountData.name || !accountData.type) {
      alert('Account name and type are required');
      return;
    }

    if (accountData.is_primary) {
      await supabase
        .from('accounts')
        .update({ is_primary: false })
        .eq('user_id', userId);
    }

    const { error } = await supabase.from('accounts').insert({
      user_id: userId,
      ...accountData,
      sort_order: accounts.length,
    });

    if (error) {
      alert('Failed to create account: ' + error.message);
      return;
    }

    await fetchAccounts();
    setShowForm(false);
  };

  const handleUpdateAccount = async (
    id: string,
    accountData: Partial<Account>
  ) => {
    if (!userId) return;

    if (accountData.is_primary) {
      await supabase
        .from('accounts')
        .update({ is_primary: false })
        .eq('user_id', userId)
        .neq('id', id);
    }

    const { error } = await supabase
      .from('accounts')
      .update(accountData)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      alert('Failed to update account: ' + error.message);
      return;
    }

    await fetchAccounts();
    setEditingAccount(null);
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete || !userId) return;

    const { error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', confirmDelete)
      .eq('user_id', userId);

    if (error) {
      alert('Failed to delete account: ' + error.message);
      return;
    }

    setAccounts((prev) => prev.filter((a) => a.id !== confirmDelete));
    setConfirmDelete(null);
  };

  const handleSetPrimary = async (id: string) => {
    if (!userId) return;

    await supabase
      .from('accounts')
      .update({ is_primary: false })
      .eq('user_id', userId);

    await supabase
      .from('accounts')
      .update({ is_primary: true })
      .eq('id', id)
      .eq('user_id', userId);

    await fetchAccounts();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent dark:border-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading accounts...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Accounts
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your bank accounts, credit cards, and cash
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingAccount(null);
              setShowForm(true);
            }}
            variant="primary"
            className="inline-flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {editingAccount ? 'Edit Account' : 'Add Account'}
            </h2>
            <AccountForm
              key={editingAccount ? `edit-${editingAccount.id}` : 'add-account'}
              initialData={editingAccount || undefined}
              onSubmit={
                editingAccount
                  ? (data) => handleUpdateAccount(editingAccount.id, data)
                  : handleAddAccount
              }
              onCancel={() => {
                setShowForm(false);
                setEditingAccount(null);
              }}
            />
          </div>
        )}

        {accounts.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-800">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              No accounts yet
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Add your first account to start tracking expenses
            </p>
            <Button
              onClick={() => setShowForm(true)}
              variant="primary"
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Account
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={accounts.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {accounts.map((account) => (
                  <SortableAccountCard
                    key={account.id}
                    account={account}
                    onEdit={() => {
                      setEditingAccount(account);
                      setShowForm(true);
                    }}
                    onDelete={() => setConfirmDelete(account.id)}
                    onSetPrimary={() => handleSetPrimary(account.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Account"
        message="Are you sure you want to delete this account? Expenses linked to this account will not be deleted, but will need to be reassigned."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
