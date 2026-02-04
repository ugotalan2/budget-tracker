import { formatCurrency } from '@/lib/calculations';
import BudgetMenu from './BudgetMenu';

type BudgetProgressProps = {
  categoryId: string;
  categoryName: string;
  categoryColor?: string;
  limitAmount: number;
  spent: number;
  percentage: number;
  isOverBudget: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function BudgetProgress({
  categoryName,
  categoryColor = '#3B82F6',
  limitAmount,
  spent,
  percentage,
  isOverBudget,
  onEdit,
  onDelete,
}: BudgetProgressProps) {
  const remaining = limitAmount - spent;

  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (percentage >= 90) return 'bg-yellow-500';
    if (percentage >= 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (isOverBudget) return 'text-red-600 dark:text-red-500';
    if (percentage >= 90) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="relative rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      {/* Menu in top-right inside the card */}
      {onEdit && onDelete && (
        <div className="absolute right-3 top-3">
          <BudgetMenu onEdit={onEdit} onDelete={onDelete} />
        </div>
      )}

      <div className="mb-2 flex items-center justify-between pr-10">
        <div className="flex items-center gap-3">
          {/* Add color indicator */}
          <div
            className="h-8 w-8 rounded-lg flex-shrink-0"
            style={{ backgroundColor: categoryColor }}
          />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {categoryName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Budget: {formatCurrency(limitAmount)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-semibold ${getTextColor()}`}>
            {formatCurrency(spent)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isOverBudget ? (
              <span className="text-red-600 dark:text-red-500">
                {formatCurrency(Math.abs(remaining))} over
              </span>
            ) : (
              <span className="text-green-600 dark:text-green-500">
                {formatCurrency(remaining)} left
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs">
        <span className={getTextColor()}>{percentage.toFixed(1)}% used</span>
        {isOverBudget && (
          <span className="font-medium text-red-600 dark:text-red-500">
            ⚠️ Over Budget
          </span>
        )}
      </div>
    </div>
  );
}
