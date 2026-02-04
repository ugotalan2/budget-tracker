import {
  generateMonthOptions,
  getPreviousMonth,
  getNextMonth,
  getMonthBoundariesFromString,
  formatMonthYear,
} from '../dateUtils';

describe('dateUtils', () => {
  describe('getPreviousMonth', () => {
    it('should get previous month in same year', () => {
      expect(getPreviousMonth('2026-03')).toBe('2026-02');
      expect(getPreviousMonth('2026-06')).toBe('2026-05');
    });

    it('should handle year rollover', () => {
      expect(getPreviousMonth('2026-01')).toBe('2025-12');
    });

    it('should maintain zero padding', () => {
      expect(getPreviousMonth('2026-10')).toBe('2026-09');
    });
  });

  describe('getNextMonth', () => {
    it('should get next month in same year', () => {
      expect(getNextMonth('2026-02')).toBe('2026-03');
      expect(getNextMonth('2026-05')).toBe('2026-06');
    });

    it('should handle year rollover', () => {
      expect(getNextMonth('2026-12')).toBe('2027-01');
    });

    it('should maintain zero padding', () => {
      expect(getNextMonth('2026-09')).toBe('2026-10');
    });
  });

  describe('getMonthBoundariesFromString', () => {
    it('should return correct boundaries for February 2026', () => {
      const { start, end } = getMonthBoundariesFromString('2026-02');
      expect(start).toBe('2026-02-01');
      expect(end).toBe('2026-02-28');
    });

    it('should handle leap years', () => {
      const { start, end } = getMonthBoundariesFromString('2024-02');
      expect(start).toBe('2024-02-01');
      expect(end).toBe('2024-02-29');
    });

    it('should handle months with 31 days', () => {
      const { start, end } = getMonthBoundariesFromString('2026-01');
      expect(start).toBe('2026-01-01');
      expect(end).toBe('2026-01-31');
    });

    it('should handle months with 30 days', () => {
      const { start, end } = getMonthBoundariesFromString('2026-04');
      expect(start).toBe('2026-04-01');
      expect(end).toBe('2026-04-30');
    });

    it('should handle December (year boundary)', () => {
      const { start, end } = getMonthBoundariesFromString('2026-12');
      expect(start).toBe('2026-12-01');
      expect(end).toBe('2026-12-31');
    });
  });

  describe('formatMonthYear', () => {
    it('should format month and year correctly', () => {
      expect(formatMonthYear('2026-02')).toBe('February 2026');
      expect(formatMonthYear('2026-12')).toBe('December 2026');
      expect(formatMonthYear('2026-01')).toBe('January 2026');
    });
  });

  describe('generateMonthOptions', () => {
    it('should generate correct number of options', () => {
      const options = generateMonthOptions(3, 12);
      // 3 back + 12 forward (including current) = 15
      expect(options.length).toBe(15);
    });

    it('should have value in YYYY-MM format', () => {
      const options = generateMonthOptions(1, 1);
      options.forEach((option) => {
        expect(option.value).toMatch(/^\d{4}-\d{2}$/);
      });
    });

    it('should have readable label', () => {
      const options = generateMonthOptions(1, 1);
      options.forEach((option) => {
        expect(option.label).toMatch(/^[A-Z][a-z]+ \d{4}$/);
      });
    });
  });
});
