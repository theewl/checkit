import { describe, expect, it } from 'vitest';
import { amountFor, daysLeft, getPeriod, yearlyValue } from './periods';
import { firstReminder } from './reminders';
import { CATALOG } from '../data/cards';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('getPeriod', () => {
  it('monthly', () => {
    const p = getPeriod('monthly', d(2026, 2, 14));
    expect(p.key).toBe('2026-02');
    expect(p.end).toEqual(d(2026, 2, 28));
  });

  it('quarterly', () => {
    const p = getPeriod('quarterly', d(2026, 11, 1));
    expect(p.key).toBe('2026-Q4');
    expect(p.start).toEqual(d(2026, 10, 1));
    expect(p.end).toEqual(d(2026, 12, 31));
  });

  it('semiannual', () => {
    expect(getPeriod('semiannual', d(2026, 6, 30)).key).toBe('2026-H1');
    expect(getPeriod('semiannual', d(2026, 7, 1)).end).toEqual(d(2026, 12, 31));
  });

  it('annual calendar and anniversary', () => {
    expect(getPeriod('annual', d(2026, 11, 1)).key).toBe('2026');
    const before = getPeriod('annual', d(2026, 3, 10), 'anniversary', 5);
    expect(before.key).toBe('A2025-05');
    expect(before.end).toEqual(d(2026, 4, 30));
    const after = getPeriod('annual', d(2026, 5, 1), 'anniversary', 5);
    expect(after.key).toBe('A2026-05');
  });
});

describe('amounts', () => {
  const uber = CATALOG.find((c) => c.id === 'amex-platinum')!.benefits.find((b) => b.id === 'uber')!;
  it('applies December override', () => {
    expect(amountFor(uber, d(2026, 11, 5))).toBe(15);
    expect(amountFor(uber, d(2026, 12, 5))).toBe(35);
    expect(yearlyValue(uber)).toBe(200);
  });

  it('daysLeft', () => {
    const p = getPeriod('monthly', d(2026, 11, 1));
    expect(daysLeft(p, d(2026, 11, 1))).toBe(29);
    expect(daysLeft(p, new Date(2026, 10, 30, 23, 0))).toBe(0);
  });
});

describe('firstReminder', () => {
  it('monthly, 7 days before end', () => {
    expect(firstReminder(0, d(2026, 11, 1), 7, 1)).toEqual(d(2026, 11, 23));
    expect(firstReminder(0, d(2026, 11, 25), 7, 1)).toEqual(d(2026, 12, 24));
  });
  it('quarterly lands in the last month of a quarter', () => {
    expect(firstReminder(2, d(2026, 11, 1), 7, 3)).toEqual(d(2026, 12, 24));
    expect(firstReminder(2, d(2026, 12, 30), 7, 3)).toEqual(d(2027, 3, 24));
  });
  it('anniversary annual', () => {
    // Anniversary in May → period ends in April.
    expect(firstReminder(3, d(2026, 11, 1), 7, 12)).toEqual(d(2027, 4, 23));
  });
});

describe('foldLine', () => {
  it('keeps every physical line within 75 octets', async () => {
    const { foldLine } = await import('./reminders');
    const folded = foldLine('DESCRIPTION:' + '• credit — '.repeat(30));
    for (const l of folded.split('\r\n')) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, '')).toBe('DESCRIPTION:' + '• credit — '.repeat(30));
  });
});
