import { formatCurrency } from '@/lib/calculations';

type BudgetProgressProps = {
  category: string;
  limitAmount: number;
  spent: number;
  percentage: number;
  isOverBudget: boolean;
};

export default function BudgetProgress({
  category,
  limitAmount,
  spent,
  percentage,
  isOverBudget,
}: BudgetProgressProps) {
  const remaining = limitAmount - spent;

  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (percentage >= 90) return 'bg-yellow-500';
    if (percentage >= 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (isOverBudget) return 'text-red-600';
    if (percentage >= 90) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{category}</h3>
          <p className="text-sm text-gray-500">
            Budget: {formatCurrency(limitAmount)}
          </p>
        </div>
        <div className="text-right">
          <p className={`font-semibold ${getTextColor()}`}>
            {formatCurrency(spent)}
          </p>
          <p className="text-sm text-gray-500">
            {isOverBudget ? (
              <span className="text-red-600">
                {formatCurrency(Math.abs(remaining))} over
              </span>
            ) : (
              <span className="text-green-600">
                {formatCurrency(remaining)} left
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs">
        <span className={getTextColor()}>{percentage.toFixed(1)}% used</span>
        {isOverBudget && (
          <span className="font-medium text-red-600">⚠️ Over Budget</span>
        )}
      </div>
    </div>
  );
}
