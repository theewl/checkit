import { useCallback, useEffect, useState } from 'react';
import type { AppState, Benefit, UsageEntry, UserCard } from '../types';
import { findCatalogCard } from '../data/cards';
import { amountFor, daysLeft, getBenefitPeriod, type Period } from './periods';

const STORAGE_KEY = 'checkit:v1';

export const DEFAULT_STATE: AppState = {
  cards: [],
  usage: [],
  settings: { remindDaysBefore: 7, notificationsEnabled: false },
  notified: [],
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const state = {
      ...DEFAULT_STATE,
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
    };
    return { ...state, cards: state.cards.map(syncWithCatalog) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode); app still works for this session.
  }
}

/**
 * Bring a saved card up to date with the current catalog: new credits are added, changed
 * amounts updated, and discontinued credits dropped. Credits the user edited or added
 * themselves are kept as they are.
 */
export function syncWithCatalog(card: UserCard): UserCard {
  const c = findCatalogCard(card.catalogId);
  if (!c) return card;
  const edited = new Set(card.editedIds ?? []);
  const existing = new Map(card.benefits.map((b) => [b.id, b]));
  const fromCatalog = c.benefits.map((b) => (edited.has(b.id) && existing.has(b.id) ? existing.get(b.id)! : { ...b }));
  const custom = card.benefits.filter((b) => b.id.startsWith('custom-'));
  return {
    ...card,
    annualFee: edited.has('__fee') ? card.annualFee : c.annualFee,
    benefits: [...fromCatalog, ...custom],
  };
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);
  useEffect(() => saveState(state), [state]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);
  return [state, update] as const;
}

export function cardFromCatalog(catalogId: string, anniversaryMonth: number): UserCard | null {
  const c = findCatalogCard(catalogId);
  if (!c) return null;
  return {
    id: uid(),
    catalogId: c.id,
    name: c.name,
    issuer: c.issuer,
    color: c.color,
    annualFee: c.annualFee,
    anniversaryMonth,
    benefits: c.benefits.map((b) => ({ ...b })),
    hiddenBenefitIds: [],
  };
}

export interface BenefitStatus {
  card: UserCard;
  benefit: Benefit;
  period: Period;
  available: number;
  used: number;
  remaining: number;
  daysLeft: number;
  entries: UsageEntry[];
}

export function benefitStatus(
  card: UserCard,
  benefit: Benefit,
  usage: UsageEntry[],
  today: Date,
): BenefitStatus {
  if (benefit.everyYears) return multiYearStatus(card, benefit, usage, today);
  const period = getBenefitPeriod(benefit, today, card.anniversaryMonth);
  const available = amountFor(benefit, today);
  const entries = usage.filter(
    (u) => u.cardId === card.id && u.benefitId === benefit.id && u.periodKey === period.key,
  );
  const used = Math.min(available, round2(entries.reduce((s, e) => s + e.amount, 0)));
  return {
    card,
    benefit,
    period,
    available,
    used,
    remaining: round2(available - used),
    daysLeft: daysLeft(period, today),
    entries,
  };
}

/**
 * Multi-year credits (Global Entry, TSA PreCheck…): a cycle of `everyYears` years starts on
 * the first use. Before any use, or after a cycle ends, the full amount is available.
 */
function multiYearStatus(card: UserCard, benefit: Benefit, usage: UsageEntry[], today: Date): BenefitStatus {
  const n = benefit.everyYears!;
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // Months, so 4.5-year cycles (TSA PreCheck on some cards) work too.
  const cycleEnd = (start: Date) => new Date(start.getFullYear(), start.getMonth() + Math.round(n * 12), start.getDate() - 1);
  const mine = usage
    .filter((u) => u.cardId === card.id && u.benefitId === benefit.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  let start: Date | null = null;
  for (const e of mine) {
    const d = day(new Date(e.date));
    if (!start || d > cycleEnd(start)) start = d;
  }
  const t = day(today);
  const active = start && cycleEnd(start) >= t ? start : null;
  const entries = active ? mine.filter((e) => day(new Date(e.date)) >= active) : [];
  const available = benefit.amount;
  const used = Math.min(available, round2(entries.reduce((s, e) => s + e.amount, 0)));
  const periodStart = active ?? t;
  const end = cycleEnd(periodStart);
  const period: Period = {
    key: active ? `C${periodStart.toISOString().slice(0, 10)}` : 'open',
    start: periodStart,
    end,
    label: active
      ? `Every ${n} years · renews ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
      : `Every ${n} years · available now`,
  };
  return {
    card,
    benefit,
    period,
    available,
    used,
    remaining: round2(available - used),
    // No deadline until you start a cycle, so keep it out of "expiring soon".
    daysLeft: active ? daysLeft(period, today) : Number.MAX_SAFE_INTEGER,
    entries,
  };
}

export function allStatuses(state: AppState, today: Date): BenefitStatus[] {
  return state.cards.flatMap((card) =>
    card.benefits
      .filter((b) => !card.hiddenBenefitIds.includes(b.id))
      .map((b) => benefitStatus(card, b, state.usage, today)),
  );
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const money = (n: number) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
