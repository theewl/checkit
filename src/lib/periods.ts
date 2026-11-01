import type { Benefit, Frequency, ResetBasis } from '../types';

export interface Period {
  /** Stable id for this period, e.g. "2026-03", "2026-Q1", "2026-H1", "2026", "A2026-05". */
  key: string;
  start: Date;
  /** Last day of the period (inclusive), at local midnight. */
  end: Date;
  label: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Last day of the month that starts at (year, month0 + spanMonths - 1). */
function endOf(year: number, month0: number, spanMonths: number): Date {
  return new Date(year, month0 + spanMonths, 0);
}

export function getPeriod(
  frequency: Frequency,
  date: Date,
  resetBasis: ResetBasis = 'calendar',
  anniversaryMonth = 1,
): Period {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-11

  switch (frequency) {
    case 'monthly':
      return {
        key: `${y}-${pad(m + 1)}`,
        start: new Date(y, m, 1),
        end: endOf(y, m, 1),
        label: `${MONTHS[m]} ${y}`,
      };
    case 'quarterly': {
      const q = Math.floor(m / 3);
      return {
        key: `${y}-Q${q + 1}`,
        start: new Date(y, q * 3, 1),
        end: endOf(y, q * 3, 3),
        label: `Q${q + 1} ${y} (${MONTHS[q * 3]}–${MONTHS[q * 3 + 2]})`,
      };
    }
    case 'semiannual': {
      const h = m < 6 ? 0 : 1;
      return {
        key: `${y}-H${h + 1}`,
        start: new Date(y, h * 6, 1),
        end: endOf(y, h * 6, 6),
        label: h === 0 ? `Jan–Jun ${y}` : `Jul–Dec ${y}`,
      };
    }
    case 'annual': {
      if (resetBasis === 'anniversary') {
        const a = anniversaryMonth - 1;
        const startYear = m >= a ? y : y - 1;
        const start = new Date(startYear, a, 1);
        const end = endOf(startYear, a, 12);
        return {
          key: `A${startYear}-${pad(a + 1)}`,
          start,
          end,
          label: `${MONTHS[a]} ${startYear} – ${MONTHS[end.getMonth()]} ${end.getFullYear()}`,
        };
      }
      return {
        key: `${y}`,
        start: new Date(y, 0, 1),
        end: new Date(y, 11, 31),
        label: `${y}`,
      };
    }
  }
}

export function getBenefitPeriod(benefit: Benefit, date: Date, anniversaryMonth: number): Period {
  return getPeriod(benefit.frequency, date, benefit.resetBasis, anniversaryMonth);
}

/** Amount available for a benefit in the period containing `date`. */
export function amountFor(benefit: Benefit, date: Date): number {
  if (benefit.frequency === 'monthly' && benefit.monthOverrides) {
    const o = benefit.monthOverrides[date.getMonth() + 1];
    if (o !== undefined) return o;
  }
  return benefit.amount;
}

/** Whole days from `today` until the end of the period (0 = last day is today). */
export function daysLeft(period: Period, today: Date): number {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((period.end.getTime() - t.getTime()) / 86_400_000);
}

/** Value of a benefit over a full year, for "annual value vs. fee" math. */
export function yearlyValue(benefit: Benefit): number {
  if (benefit.everyYears) return benefit.amount / benefit.everyYears;
  switch (benefit.frequency) {
    case 'monthly': {
      let total = 0;
      for (let mo = 1; mo <= 12; mo++) total += benefit.monthOverrides?.[mo] ?? benefit.amount;
      return total;
    }
    case 'quarterly':
      return benefit.amount * 4;
    case 'semiannual':
      return benefit.amount * 2;
    case 'annual':
      return benefit.amount;
  }
}

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semiannual: 'Every 6 months',
  annual: 'Yearly',
};
