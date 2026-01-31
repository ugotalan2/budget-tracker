'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Download } from 'lucide-react';

type ExpenseActionsMenuProps = {
  onExportVisible: () => void;
  onExportAll: () => void;
  onExportMonth: () => void;
  visibleCount: number;
  monthLabel: string;
  filterLabel?: string;
};

export default function ExpenseActionsMenu({
  onExportVisible,
  onExportAll,
  onExportMonth,
  visibleCount,
  monthLabel,
  filterLabel,
}: ExpenseActionsMenuProps) {
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
        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:text-gray-500 dark:hover:bg-gray-900/30 dark:hover:text-gray-400"
        title="More options"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-8 z-10 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="p-1">
            <button
              onClick={() => {
                onExportVisible();
                setIsOpen(false);
              }}
              className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors dark:hover:bg-gray-700"
            >
              <Download className="mt-0.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Export Visible
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {visibleCount} expense{visibleCount !== 1 ? 's' : ''}
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                onExportAll();
                setIsOpen(false);
              }}
              className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors dark:hover:bg-gray-700"
            >
              <Download className="mt-0.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Export All Matching
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {filterLabel || 'All expenses'}
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                onExportMonth();
                setIsOpen(false);
              }}
              className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors rounded-b-md dark:hover:bg-gray-700"
            >
              <Download className="mt-0.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Export This Month
                </p>
                <p className="text-xs text-gray-500 dark;text-gray-400">
                  {monthLabel}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
