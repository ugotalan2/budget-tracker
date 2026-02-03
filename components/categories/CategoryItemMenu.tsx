'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Pencil, Trash2, Plus } from 'lucide-react';

type CategoryItemMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
  onAddChild?: () => void;
  hasChildren?: boolean;
  isChild?: boolean;
};

export default function CategoryItemMenu({
  onEdit,
  onDelete,
  onAddChild,
  hasChildren = false,
  isChild = false,
}: CategoryItemMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        title="More options"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-10">
          <div className="py-1">
            {!isChild && onAddChild && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild();
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Plus className="h-4 w-4" />
                Add Subcategory
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              disabled={hasChildren}
              title={
                hasChildren ? 'Delete subcategories first' : 'Delete category'
              }
            >
              <Trash2 className="h-4 w-4" />
              Delete {hasChildren && '(has subcategories)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
