'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';
import { type Category } from '@/lib/types';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import CategoryForm from '@/components/categories/CategoryForm';
import CategoryItemMenu from '@/components/categories/CategoryItemMenu';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  closestCorners,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

function SortableCategoryCard({
  parent,
  childCategories,
  isExpanded,
  isDraggedOver,
  activeId,
  onToggleExpanded,
  onEdit,
  onDelete,
  onAddChild,
  onEditChild,
  onDeleteChild,
}: {
  parent: Category;
  childCategories: Category[];
  isExpanded: boolean;
  isDraggedOver?: boolean;
  activeId?: string | null;
  onToggleExpanded: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild: () => void;
  onEditChild: (child: Category) => void;
  onDeleteChild: (childId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: parent.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border-2 bg-white dark:bg-gray-800 transition-all ${
        isDraggedOver
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Parent Category */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:text-gray-500 dark:hover:text-gray-400"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          {childCategories.length > 0 && (
            <button
              onClick={onToggleExpanded}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          )}
          <div
            className="h-8 w-8 rounded-lg flex-shrink-0"
            style={{ backgroundColor: parent.color }}
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {parent.name}
            </h3>
            {childCategories.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {childCategories.length} subcategor
                {childCategories.length === 1 ? 'y' : 'ies'}
              </p>
            )}
          </div>
        </div>
        <CategoryItemMenu
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          hasChildren={childCategories.length > 0}
        />
      </div>

      {/* Drop indicator */}
      {isDraggedOver && (
        <div className="border-t-2 border-blue-500 bg-blue-50 px-4 py-2 dark:bg-blue-900/20">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Drop here to move to {parent.name}
          </p>
        </div>
      )}

      {/* Child Categories */}
      {isExpanded && childCategories.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
          <SortableContext
            items={childCategories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {childCategories.map((child) => (
              <SortableChildCategory
                key={child.id}
                child={child}
                onEdit={() => onEditChild(child)}
                onDelete={() => onDeleteChild(child.id)}
                activeId={activeId} // Pass activeId
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

// Update SortableChildCategory to show drop indicator
function SortableChildCategory({
  child,
  onEdit,
  onDelete,
  activeId,
}: {
  child: Category;
  onEdit: () => void;
  onDelete: () => void;
  activeId?: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver: isDndOver,
  } = useSortable({ id: child.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const showDropIndicator = isDndOver && activeId !== child.id;

  return (
    <>
      {showDropIndicator && (
        <div className="relative py-1">
          <div className="absolute inset-x-4 h-1 bg-blue-500 rounded-full" />
        </div>
      )}
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center justify-between border-b border-gray-200 p-4 pl-12 last:border-0 dark:border-gray-700"
      >
        <div className="flex items-center gap-3">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:text-gray-500 dark:hover:text-gray-400"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <div
            className="h-6 w-6 rounded"
            style={{ backgroundColor: child.color }}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {child.name}
          </span>
        </div>
        <CategoryItemMenu onEdit={onEdit} onDelete={onDelete} isChild />
      </div>
    </>
  );
}

export default function CategoriesPage() {
  const { userId } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [addingChildTo, setAddingChildTo] = useState<string | undefined>(
    undefined
  );
  const [addingChildColor, setAddingChildColor] = useState<string | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const supabase = createClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const fetchCategories = async () => {
    if (!userId) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order')
      .order('name');

    if (!error && data) {
      const categoriesData = data as Category[];
      setCategories(categoriesData);
      // Auto-expand all parent categories
      const parentIds = categoriesData
        .filter((c) => !c.parent_id)
        .map((c) => c.id);
      setExpandedCategories(new Set(parentIds));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // In the main component, add this effect
  useEffect(() => {
    if (!overId) return;

    const overCategory = categories.find((c) => c.id === overId);
    const activeCategory = categories.find((c) => c.id === activeId);

    // If dragging a child over a parent, auto-expand it
    if (overCategory && !overCategory.parent_id && activeCategory?.parent_id) {
      if (!expandedCategories.has(overId)) {
        setExpandedCategories((prev) => new Set([...prev, overId]));
      }
    }
  }, [overId, activeId, categories, expandedCategories]);

  const handleAddCategory = async (categoryData: Partial<Category>) => {
    if (!userId) return;

    if (!categoryData.name) {
      alert('Category name is required');
      return;
    }

    const { error } = await supabase.from('categories').insert({
      user_id: userId,
      ...categoryData,
      sort_order: categories.length,
    });

    if (error) {
      alert('Failed to create category: ' + error.message);
      return;
    }

    await fetchCategories();
    setShowForm(false);
  };

  const handleUpdateCategory = async (
    id: string,
    categoryData: Partial<Category>
  ) => {
    if (!userId) return;

    const { error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      alert('Failed to update category: ' + error.message);
      return;
    }

    await fetchCategories();
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete || !userId) return;

    // Soft delete
    const { error } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', confirmDelete)
      .eq('user_id', userId);

    if (error) {
      alert('Failed to delete category: ' + error.message);
      return;
    }

    setCategories((prev) => prev.filter((c) => c.id !== confirmDelete));
    setConfirmDelete(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId((event.over?.id as string) || null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const activeCategory = categories.find((c) => c.id === active.id);
    const overCategory = categories.find((c) => c.id === over.id);

    if (!activeCategory || !overCategory) return;

    // Case 1: Both are parents - reorder parents
    if (!activeCategory.parent_id && !overCategory.parent_id) {
      const oldIndex = parentCategories.findIndex((c) => c.id === active.id);
      const newIndex = parentCategories.findIndex((c) => c.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newParentOrder = arrayMove(parentCategories, oldIndex, newIndex);

      const allCategories = [
        ...newParentOrder,
        ...categories.filter((c) => c.parent_id),
      ];
      setCategories(allCategories);

      const updates = newParentOrder.map((category, index) => ({
        id: category.id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('categories')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
          .eq('user_id', userId);
      }
    }
    // Case 2: Dragging a child onto a parent - move to that parent
    else if (activeCategory.parent_id && !overCategory.parent_id) {
      const newParentId = overCategory.id;
      const newColor = overCategory.color;

      // Optimistic update
      const updatedCategories = categories.map((c) =>
        c.id === activeCategory.id
          ? {
              ...c,
              parent_id: newParentId,
              color: newColor,
              sort_order: getChildren(newParentId).length,
            }
          : c
      );
      setCategories(updatedCategories);

      // Auto-expand new parent to show the moved item
      setExpandedCategories((prev) => new Set([...prev, newParentId]));

      // Database update
      await supabase
        .from('categories')
        .update({
          parent_id: newParentId,
          color: newColor,
          sort_order: getChildren(newParentId).length,
        })
        .eq('id', activeCategory.id)
        .eq('user_id', userId);
    }
    // Case 3: Both are children - reorder within same parent OR move to different parent
    else if (activeCategory.parent_id && overCategory.parent_id) {
      // Same parent - reorder
      if (activeCategory.parent_id === overCategory.parent_id) {
        const siblings = getChildren(activeCategory.parent_id);
        const oldIndex = siblings.findIndex((c) => c.id === active.id);
        const newIndex = siblings.findIndex((c) => c.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const newOrder = arrayMove(siblings, oldIndex, newIndex);

        // Update UI optimistically
        const otherCategories = categories.filter(
          (c) => !c.parent_id || c.parent_id !== activeCategory.parent_id
        );
        setCategories([...otherCategories, ...newOrder]);

        // Update database
        const updates = newOrder.map((category, index) => ({
          id: category.id,
          sort_order: index,
        }));

        for (const update of updates) {
          await supabase
            .from('categories')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id)
            .eq('user_id', userId);
        }
      }

      // Different parent - move to other parent
      else {
        const newParentId = overCategory.parent_id!;
        const newParent = categories.find((c) => c.id === newParentId);
        const newColor = newParent?.color || overCategory.color;

        const targetSiblings = getChildren(newParentId);
        const overIndex = targetSiblings.findIndex((c) => c.id === over.id);

        // Create updated version of moved item
        const movedItem = {
          ...activeCategory,
          parent_id: newParentId,
          color: newColor,
        };

        // Remove from old location and add to new
        const updatedCategories = categories
          .filter((c) => c.id !== activeCategory.id) // Remove the moving item
          .map((c) => {
            // Reorder old parent's children
            if (c.parent_id === activeCategory.parent_id) {
              const oldSiblings = categories.filter(
                (cat) =>
                  cat.parent_id === activeCategory.parent_id &&
                  cat.id !== activeCategory.id
              );
              const newIndex = oldSiblings.findIndex((s) => s.id === c.id);
              return { ...c, sort_order: newIndex };
            }
            return c;
          });

        // Insert into new parent
        const newParentChildren = updatedCategories.filter(
          (c) => c.parent_id === newParentId
        );
        const withMovedItem = [
          ...newParentChildren.slice(0, overIndex),
          movedItem,
          ...newParentChildren.slice(overIndex),
        ].map((c, index) => ({ ...c, sort_order: index }));

        // Final categories array
        const finalCategories = [
          ...updatedCategories.filter((c) => c.parent_id !== newParentId),
          ...withMovedItem,
        ];

        setCategories(finalCategories);

        // Database update
        await supabase
          .from('categories')
          .update({
            parent_id: newParentId,
            color: newColor,
            sort_order: overIndex,
          })
          .eq('id', activeCategory.id)
          .eq('user_id', userId);

        // Reorder siblings in both parents
        const oldSiblings = categories.filter(
          (c) =>
            c.parent_id === activeCategory.parent_id &&
            c.id !== activeCategory.id
        );
        for (const [index, sibling] of oldSiblings.entries()) {
          await supabase
            .from('categories')
            .update({ sort_order: index })
            .eq('id', sibling.id)
            .eq('user_id', userId);
        }

        for (const [index, sibling] of withMovedItem.entries()) {
          if (sibling.id !== activeCategory.id) {
            await supabase
              .from('categories')
              .update({ sort_order: index })
              .eq('id', sibling.id)
              .eq('user_id', userId);
          }
        }
      }
    }
  };

  const parentCategories = categories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent dark:border-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading categories...
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
              Categories
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Organize your expenses with custom categories
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingCategory(null);
              setAddingChildTo(undefined);
              setAddingChildColor(undefined);
              setShowForm(true);
            }}
            variant="primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            <CategoryForm
              key={
                editingCategory ? `edit-${editingCategory.id}` : 'add-category'
              }
              initialData={editingCategory || undefined}
              parentCategories={parentCategories}
              defaultParentId={addingChildTo}
              defaultColor={addingChildColor}
              onSubmit={
                editingCategory
                  ? (data) => handleUpdateCategory(editingCategory.id, data)
                  : handleAddCategory
              }
              onCancel={() => {
                setShowForm(false);
                setEditingCategory(null);
                setAddingChildTo(undefined);
                setAddingChildColor(undefined);
              }}
            />
          </div>
        )}

        {categories.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-800">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              No categories yet
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Add your first category to start organizing expenses
            </p>
            <Button
              onClick={() => {
                setAddingChildTo(undefined);
                setAddingChildColor(undefined);
                setShowForm(true);
              }}
              variant="primary"
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Category
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={parentCategories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {parentCategories.map((parent) => {
                  const children = getChildren(parent.id);
                  const isExpanded = expandedCategories.has(parent.id);
                  const isDraggedOver = overId === parent.id;
                  const activeCategory = categories.find(
                    (c) => c.id === activeId
                  );
                  const canDrop = !!(
                    activeCategory?.parent_id &&
                    activeCategory.parent_id !== parent.id
                  );
                  return (
                    <SortableCategoryCard
                      key={parent.id}
                      parent={parent}
                      childCategories={children}
                      isExpanded={isExpanded}
                      isDraggedOver={isDraggedOver && canDrop}
                      activeId={activeId}
                      onToggleExpanded={() => toggleExpanded(parent.id)}
                      onEdit={() => {
                        setEditingCategory(parent);
                        setShowForm(true);
                      }}
                      onDelete={() => setConfirmDelete(parent.id)}
                      onAddChild={() => {
                        setEditingCategory(null);
                        setAddingChildTo(parent.id);
                        setAddingChildColor(parent.color);
                        setShowForm(true);
                      }}
                      onEditChild={(child) => {
                        setEditingCategory(child);
                        setShowForm(true);
                      }}
                      onDeleteChild={(childId) => setConfirmDelete(childId)}
                    />
                  );
                })}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeId ? (
                <div className="rounded-lg border-2 border-blue-500 bg-white p-4 shadow-lg dark:bg-gray-800 opacity-90">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-6 w-6 rounded"
                      style={{
                        backgroundColor: categories.find(
                          (c) => c.id === activeId
                        )?.color,
                      }}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {categories.find((c) => c.id === activeId)?.name}
                    </span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? Expenses using this category will need to be recategorized."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
