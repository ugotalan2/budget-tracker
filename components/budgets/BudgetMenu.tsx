'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Pencil, Trash2, Eye } from 'lucide-react';

type BudgetMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails?: () => void;
};

export default function BudgetMenu({
  onEdit,
  onDelete,
  onViewDetails,
}: BudgetMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Three-dot button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        title="More options"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-8 z-10 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
          {onViewDetails && (
            <button
              onClick={() => {
                onViewDetails();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Eye className="h-4 w-4" />
              View Details
            </button>
          )}
          <button
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit Budget
          </button>
          <button
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-lg"
          >
            <Trash2 className="h-4 w-4" />
            Delete Budget
          </button>
        </div>
      )}
    </div>
  );
}
