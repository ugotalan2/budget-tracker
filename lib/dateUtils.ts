export function generateMonthOptions(
  backMonths: number = 3,
  forwardMonths: number = 12
) {
  const options: { value: string; label: string }[] = [];
  const currentDate = new Date();

  // Go Months 3 months
  for (let i = backMonths; i >= 1; i--) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1
    );
    const value = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
    options.push({ value, label });
  }

  // Current month + rangeMonths forward
  for (let i = 0; i <= forwardMonths - 1; i++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + i,
      1
    );
    const value = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
    options.push({ value, label });
  }

  return options;
}

export function getPreviousMonth(currentMonth: string): string {
  const [year, month] = currentMonth.split('-').map(Number);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
}

export function getNextMonth(currentMonth: string): string {
  const [year, month] = currentMonth.split('-').map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
}

// Get month boundaries in YYYY-MM-DD format (local timezone)
export function getMonthBoundaries(year?: number, month?: number) {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth();

  // First day of month
  const start = new Date(targetYear, targetMonth, 1);
  const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;

  // Last day of month
  const end = new Date(targetYear, targetMonth + 1, 0);
  const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

  return { start: startStr, end: endStr };
}

// Alternative: From YYYY-MM string
export function getMonthBoundariesFromString(monthStr: string) {
  const [year, month] = monthStr.split('-').map(Number);
  return getMonthBoundaries(year, month - 1); // JS months are 0-indexed
}

// Format YYYY-MM to "Month Year"
export function formatMonthYear(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 15); // Use 15th to avoid timezone issues
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
