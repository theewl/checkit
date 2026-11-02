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

describe('multi-year credits', () => {
  it('starts a cycle on first use and reopens after it', async () => {
    const { benefitStatus } = await import('./store');
    const card = {
      id: 'c', catalogId: null, name: 'X', issuer: 'Y', color: '#000', annualFee: 0,
      anniversaryMonth: 1, hiddenBenefitIds: [],
      benefits: [{ id: 'ge', name: 'Global Entry', amount: 120, frequency: 'annual' as const, everyYears: 4, category: 'travel' as const }],
    };
    const b = card.benefits[0];
    expect(benefitStatus(card, b, [], d(2026, 11, 1)).remaining).toBe(120);
    const usage = [{ id: 'u', cardId: 'c', benefitId: 'ge', periodKey: 'open', amount: 120, date: d(2026, 11, 1).toISOString() }];
    const used = benefitStatus(card, b, usage, d(2028, 5, 1));
    expect(used.remaining).toBe(0);
    expect(used.period.end).toEqual(d(2030, 10, 31));
    expect(benefitStatus(card, b, usage, d(2030, 11, 1)).remaining).toBe(120);
  });
});

describe('catalog', () => {
  it('has unique ids and sane amounts', () => {
    expect(new Set(CATALOG.map((c) => c.id)).size).toBe(CATALOG.length);
    for (const c of CATALOG) {
      expect(new Set(c.benefits.map((b) => b.id)).size, c.id).toBe(c.benefits.length);
      for (const b of c.benefits) expect(b.amount, `${c.id}/${b.id}`).toBeGreaterThanOrEqual(b.oneTime ? 0 : 0.01);
    }
  });

  it('hides limited-time credits after they end', async () => {
    const { isActive } = await import('./store');
    const b = { id: 'x', name: 'x', amount: 1, frequency: 'annual' as const, endsAfter: '2026-12-31', category: 'hotel' as const };
    expect(isActive(b, new Date(2026, 11, 31, 20))).toBe(true);
    expect(isActive(b, d(2027, 1, 1))).toBe(false);
  });

  it('syncs saved cards with the catalog but keeps user edits', async () => {
    const { syncWithCatalog } = await import('./store');
    const card = {
      id: 'c', catalogId: 'chase-sapphire-preferred', name: 'Sapphire Preferred', issuer: 'Chase', color: '#000',
      annualFee: 95, anniversaryMonth: 3, hiddenBenefitIds: [], editedIds: [],
      benefits: [
        { id: 'hotel', name: 'Hotel', amount: 50, frequency: 'annual' as const, category: 'hotel' as const },
        { id: 'doordash', name: 'DoorDash', amount: 10, frequency: 'monthly' as const, category: 'dining' as const },
        { id: 'custom-1', name: 'Mine', amount: 5, frequency: 'monthly' as const, category: 'other' as const },
      ],
    };
    const synced = syncWithCatalog(card);
    expect(synced.benefits.map((b) => b.id)).toEqual(['hotel', 'apple', 'dashpass', 'global-entry', 'custom-1']);
    expect(synced.benefits[0].amount).toBe(100);
    const kept = syncWithCatalog({ ...card, editedIds: ['hotel'] });
    expect(kept.benefits[0].amount).toBe(50);
  });
});

describe('duplicate cards', () => {
  it('numbers duplicate card names', async () => {
    const { cardFromCatalog, syncWithCatalog } = await import('./store');
    const first = cardFromCatalog('amex-gold', 1)!;
    const second = cardFromCatalog('amex-gold', 1, [first.name])!;
    const third = cardFromCatalog('amex-gold', 1, [first.name, second.name])!;
    expect([first.name, second.name, third.name]).toEqual(['Gold Card', 'Gold Card 2', 'Gold Card 3']);
    expect(first.id).not.toBe(second.id);
    // Catalog sync must keep a renamed card's name.
    expect(syncWithCatalog({ ...second, name: 'Gold – Partner' }).name).toBe('Gold – Partner');
  });
});

describe('combined duplicate cards', () => {
  it('multiplies credits by the card count', async () => {
    const { cardFromCatalog, benefitStatus, displayName } = await import('./store');
    const gold = { ...cardFromCatalog('amex-gold', 1)!, count: 2 };
    const uber = gold.benefits.find((b) => b.id === 'uber')!;
    expect(benefitStatus(gold, uber, [], d(2026, 11, 2)).available).toBe(20);
    expect(displayName(gold)).toBe('Gold Card ×2');
  });

  it('merges auto-named duplicates and keeps their history', async () => {
    const { cardFromCatalog, mergeDuplicates, DEFAULT_STATE } = await import('./store');
    const a = cardFromCatalog('amex-gold', 1)!;
    const b = cardFromCatalog('amex-gold', 1, [a.name])!;
    const partner = { ...cardFromCatalog('amex-gold', 1, [a.name, b.name])!, name: 'Gold – Partner' };
    const usage = [{ id: 'u', cardId: b.id, benefitId: 'uber', periodKey: '2026-11', amount: 10, date: d(2026, 11, 2).toISOString() }];
    const merged = mergeDuplicates({ ...DEFAULT_STATE, cards: [a, b, partner], usage });
    expect(merged.cards.map((c) => [c.name, c.count ?? 1])).toEqual([['Gold Card', 2], ['Gold – Partner', 1]]);
    expect(merged.usage[0].cardId).toBe(a.id);
  });
});

describe('activate-once perks', () => {
  it('stays done once checked off and never resets', async () => {
    const { cardFromCatalog, benefitStatus, isDone } = await import('./store');
    const csr = cardFromCatalog('chase-sapphire-reserve', 1)!;
    const apple = csr.benefits.find((b) => b.id === 'apple')!;
    expect(isDone(benefitStatus(csr, apple, [], d(2026, 11, 2)))).toBe(false);
    const usage = [{ id: 'u', cardId: csr.id, benefitId: 'apple', periodKey: 'once', amount: 288, date: d(2026, 11, 2).toISOString() }];
    expect(isDone(benefitStatus(csr, apple, usage, d(2027, 3, 1)))).toBe(true);
  });

  it('counts a $0 enrollment as done when checked', async () => {
    const { cardFromCatalog, benefitStatus, isDone } = await import('./store');
    const plat = cardFromCatalog('amex-platinum', 1)!;
    const pp = plat.benefits.find((b) => b.id === 'priority-pass')!;
    const usage = [{ id: 'u', cardId: plat.id, benefitId: 'priority-pass', periodKey: 'once', amount: 0, date: d(2026, 11, 2).toISOString() }];
    expect(isDone(benefitStatus(plat, pp, [], d(2026, 11, 2)))).toBe(false);
    expect(isDone(benefitStatus(plat, pp, usage, d(2026, 11, 2)))).toBe(true);
  });

  it('shows a deadline for Sapphire Preferred Apple TV', async () => {
    const { cardFromCatalog, benefitStatus } = await import('./store');
    const csp = cardFromCatalog('chase-sapphire-preferred', 1)!;
    const apple = csp.benefits.find((b) => b.id === 'apple')!;
    expect(benefitStatus(csp, apple, [], d(2026, 12, 25)).daysLeft).toBe(6);
  });
});
