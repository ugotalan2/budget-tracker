'use client';

import { useState } from 'react';
import { type Category, CATEGORY_COLORS } from '@/lib/types';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

type CategoryFormProps = {
  initialData?: Category;
  parentCategories: Category[];
  defaultParentId?: string;
  defaultColor?: string;
  onSubmit: (data: Partial<Category>) => Promise<void>;
  onCancel: () => void;
};

export default function CategoryForm({
  initialData,
  parentCategories,
  defaultParentId,
  defaultColor,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [parentId, setParentId] = useState(
    initialData?.parent_id || defaultParentId || ''
  );
  const [color, setColor] = useState(
    initialData?.color || defaultColor || '#3B82F6'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isSubcategory = !!initialData?.parent_id || !!parentId;
  const isEditingParent = initialData && !initialData.parent_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        parent_id: parentId || null,
        color,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <Input
        label="Category Name"
        id="category-name"
        name="category-name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Groceries, Gas, Movies"
        autoComplete="off"
        autoFocus
        required
      />

      {/* Only show parent selector if adding new or editing a subcategory */}
      {!isEditingParent && (
        <Select
          label="Parent Category (Optional)"
          id="parent"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          options={[
            { value: '', label: 'None (Top-level category)' },
            ...parentCategories
              .filter((p) => p.id !== initialData?.id) // Can't be its own parent
              .map((p) => ({ value: p.id, label: p.name })),
          ]}
          hint={
            isSubcategory
              ? 'This will be a subcategory'
              : 'Create a top-level category'
          }
        />
      )}

      {/* Color Picker */}
      <div>
        <label
          htmlFor="color"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((c) => (
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
              ? 'Update Category'
              : 'Add Category'}
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
