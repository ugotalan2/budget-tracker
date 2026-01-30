'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/calculations';

type CategoryChartProps = {
  data: { category: string; amount: number }[];
};

const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6366F1', // indigo
];

export default function CategoryChart({ data }: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No spending data for this month
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: { category?: string; name?: string }) =>
                entry.category || entry.name || ''
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="amount"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number | undefined) =>
                value !== undefined ? formatCurrency(value) : '$0'
              }
              labelFormatter={(label) => label}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0];
                  return (
                    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                      <p className="font-semibold text-gray-900">
                        {item.payload.category}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(item.value as number)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(((item.value as number) / total) * 100).toFixed(1)}%
                        of total
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 border-t border-gray-200 pt-4 text-center">
        <p className="text-sm text-gray-600">Total Spending</p>
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(total)}
        </p>
      </div>
    </div>
  );
}
