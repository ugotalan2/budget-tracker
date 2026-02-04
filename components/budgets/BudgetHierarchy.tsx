'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { type Budget, type Category } from '@/lib/types';
import BudgetMenu from './BudgetMenu';
import { formatCurrency } from '@/lib/calculations';

type BudgetWithSpending = Budget & {
  spent: number;
  percentage: number;
  isOverBudget: boolean;
};

type BudgetHierarchyProps = {
  budgets: BudgetWithSpending[];
  categories: Category[];
  categoryMap: Map<string, { name: string; color: string; parent?: string }>;
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
};

export default function BudgetHierarchy({
  budgets,
  categories,
  categoryMap,
  onEdit,
  onDelete,
}: BudgetHierarchyProps) {
  const [expandedParents, setExpandedParents] = useState<Set<string>>(
    // Auto-expand all parents by default
    new Set(categories.filter((c) => !c.parent_id).map((c) => c.id))
  );

  // Get parent categories
  const parentCategories = categories.filter((c) => !c.parent_id);

  // Group budgets by parent category
  const budgetsByParent = budgets.reduce(
    (acc, budget) => {
      const category = categories.find((c) => c.id === budget.category_id);
      const parentId = category?.parent_id || budget.category_id;

      if (!parentId) return acc;

      if (!acc[parentId]) {
        acc[parentId] = [];
      }
      acc[parentId].push(budget);
      return acc;
    },
    {} as Record<string, BudgetWithSpending[]>
  );

  const toggleParent = (parentId: string) => {
    setExpandedParents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-2">
      {parentCategories
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) // Sort by sort_order
        .map((parent) => {
          const parentBudgets = budgetsByParent[parent.id] || [];
          if (parentBudgets.length === 0) return null;

          const parentBudget = parentBudgets.find(
            (b) => b.category_id === parent.id
          );
          const childBudgets = parentBudgets
            .filter((b) => {
              const cat = categories.find((c) => c.id === b.category_id);
              return cat?.parent_id === parent.id;
            })
            .sort((a, b) => {
              // Sort children by their sort_order
              const catA = categories.find((c) => c.id === a.category_id);
              const catB = categories.find((c) => c.id === b.category_id);
              return (catA?.sort_order || 0) - (catB?.sort_order || 0);
            });

          const hasChildren = childBudgets.length > 0;
          const isExpanded = expandedParents.has(parent.id);
          const categoryInfo = categoryMap.get(parent.id);

          // Calculate combined totals (parent + children spending)
          const combinedTotals =
            hasChildren && parentBudget
              ? {
                  totalBudget: parentBudget.limit_amount, // Use parent's budget as the total limit
                  totalSpent:
                    parentBudget.spent +
                    childBudgets.reduce((sum, b) => sum + b.spent, 0), // Sum all spending
                }
              : null;

          const displayBudget = combinedTotals
            ? combinedTotals.totalBudget
            : parentBudget?.limit_amount || 0;
          const displaySpent = combinedTotals
            ? combinedTotals.totalSpent
            : parentBudget?.spent || 0;
          const displayPercentage =
            displayBudget > 0 ? (displaySpent / displayBudget) * 100 : 0;
          const displayIsOverBudget = displaySpent > displayBudget;

          return (
            <div key={parent.id}>
              {/* Parent Budget Card - Shows Total */}
              <div className="relative rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                {/* Expand/Collapse button */}
                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleParent(parent.id);
                    }}
                    className="absolute left-3 top-6 z-10 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}

                {/* Parent content */}
                <div
                  onClick={
                    hasChildren ? () => toggleParent(parent.id) : undefined
                  }
                  className={`${hasChildren ? 'cursor-pointer pl-10' : 'p-2'}`}
                >
                  {/* Custom inline parent display instead of BudgetProgress */}
                  <div className="relative p-2">
                    {/* Menu */}
                    {parentBudget && onEdit && onDelete && (
                      <div className="absolute right-3 top-3">
                        <BudgetMenu
                          onEdit={() => onEdit(parentBudget)}
                          onDelete={() => onDelete(parentBudget.id)}
                        />
                      </div>
                    )}

                    {/* Single row layout */}
                    <div className="flex items-center gap-4 mb-3 pr-8">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="h-8 w-8 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: categoryInfo?.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {parent.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Budget: {formatCurrency(displayBudget)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p
                          className={`font-semibold ${
                            displayIsOverBudget
                              ? 'text-red-600 dark:text-red-500'
                              : displayPercentage >= 90
                                ? 'text-yellow-600 dark:text-yellow-500'
                                : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {formatCurrency(displaySpent)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {displayIsOverBudget ? (
                            <span className="text-red-600 dark:text-red-500">
                              {formatCurrency(
                                Math.abs(displayBudget - displaySpent)
                              )}{' '}
                              over
                            </span>
                          ) : (
                            <span className="text-green-600 dark:text-green-500">
                              {formatCurrency(displayBudget - displaySpent)}{' '}
                              left
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-lg font-semibold ${
                            displayIsOverBudget
                              ? 'text-red-600 dark:text-red-500'
                              : displayPercentage >= 90
                                ? 'text-yellow-600 dark:text-yellow-500'
                                : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {displayPercentage.toFixed(0)}%
                        </span>
                        {displayIsOverBudget && (
                          <span className="text-red-600 dark:text-red-500 text-sm">
                            ⚠️
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className={`h-full transition-all duration-300 ${
                          displayIsOverBudget
                            ? 'bg-red-500'
                            : displayPercentage >= 90
                              ? 'bg-yellow-500'
                              : displayPercentage >= 75
                                ? 'bg-orange-500'
                                : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(displayPercentage, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Child Budgets - inside same card */}
                {isExpanded && hasChildren && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 px-3 py-1 pl-16">
                    <div className="space-y-0.5">
                      {childBudgets.map((childBudget) => {
                        const childInfo = categoryMap.get(
                          childBudget.category_id || ''
                        );
                        const childName = childInfo?.name || 'Unknown';

                        const progressColor = childBudget.isOverBudget
                          ? 'bg-red-500'
                          : childBudget.percentage >= 90
                            ? 'bg-yellow-500'
                            : 'bg-green-500';

                        return (
                          <div
                            key={childBudget.id}
                            className="group flex items-center gap-3 py-0.5"
                          >
                            <div
                              className="h-4 w-4 rounded flex-shrink-0"
                              style={{ backgroundColor: childInfo?.color }}
                            />

                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate min-w-0 flex-1">
                              {childName}
                            </span>

                            <div className="relative h-1.5 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                              <div
                                className={`h-full transition-all duration-300 ${progressColor}`}
                                style={{
                                  width: `${Math.min(childBudget.percentage, 100)}%`,
                                }}
                              />
                            </div>

                            <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              {formatCurrency(childBudget.spent)}
                            </span>

                            <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                              / {formatCurrency(childBudget.limit_amount)}
                            </span>

                            <span
                              className={`text-xs font-medium whitespace-nowrap w-10 text-right ${
                                childBudget.isOverBudget
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {childBudget.percentage.toFixed(0)}%
                            </span>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <BudgetMenu
                                onEdit={() => onEdit(childBudget)}
                                onDelete={() => onDelete(childBudget.id)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
