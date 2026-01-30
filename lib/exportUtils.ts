import { Expense } from './types';

/**
 * Format date in local timezone (YYYY-MM-DD string to MM/DD/YYYY)
 */
function formatDateLocal(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${month}/${day}/${year}`;
}

/**
 * Convert expenses to CSV format
 */
export function expensesToCSV(expenses: Expense[]): string {
  // CSV headers
  const headers = ['Date', 'Category', 'Amount', 'Description'];

  // Convert expenses to CSV rows
  const rows = expenses.map((expense) => {
    const date = formatDateLocal(expense.date); // Use local format
    const category = expense.category;
    const amount = expense.amount.toFixed(2);
    const description = (expense.description || '').replace(/"/g, '""'); // Escape quotes

    return `"${date}","${category}","${amount}","${description}"`;
  });

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Download a string as a CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Create blob with UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Export expenses to CSV file
 */
export function exportExpensesToCSV(
  expenses: Expense[],
  filters?: {
    category?: string;
    month?: string;
    label?: string;
  }
): void {
  if (expenses.length === 0) {
    alert('No expenses to export');
    return;
  }

  // Generate CSV content
  const csvContent = expensesToCSV(expenses);

  // Generate filename
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let filename = `expenses-${dateStr}.csv`;

  if (filters?.label) {
    filename = `expenses-${filters.label}-${dateStr}.csv`;
  } else if (filters?.category && filters.category !== 'All') {
    filename = `expenses-${filters.category.toLowerCase()}-${dateStr}.csv`;
  } else if (filters?.month) {
    filename = `expenses-${filters.month}-${dateStr}.csv`;
  }

  // Download file
  downloadCSV(csvContent, filename);
}
