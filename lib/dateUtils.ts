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
