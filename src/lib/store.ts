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
    return mergeDuplicates({ ...state, cards: state.cards.map(syncWithCatalog) });
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

export const cardCount = (card: UserCard) => Math.max(1, card.count ?? 1);

/** "Gold Card ×2" when you hold more than one, so combined credits are clearly for multiple cards. */
export const displayName = (card: UserCard) => (cardCount(card) > 1 ? `${card.name} ×${cardCount(card)}` : card.name);

/**
 * Fold duplicate catalog cards that were added as separate entries (named "Gold Card",
 * "Gold Card 2"…) into one card with a count, moving their usage history onto it.
 * Cards the user renamed are left separate on purpose.
 */
export function mergeDuplicates(state: AppState): AppState {
  const autoNamed = (c: UserCard) => {
    const base = findCatalogCard(c.catalogId)?.name;
    return !!base && (c.name === base || new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\d+$`).test(c.name));
  };
  const keep = new Map<string, UserCard>();
  const moved = new Map<string, string>();
  const cards: UserCard[] = [];
  for (const c of state.cards) {
    const key = c.catalogId && autoNamed(c) ? c.catalogId : null;
    const first = key ? keep.get(key) : undefined;
    if (first) {
      first.count = cardCount(first) + cardCount(c);
      moved.set(c.id, first.id);
      continue;
    }
    const copy = { ...c };
    if (key) {
      copy.name = findCatalogCard(key)!.name;
      keep.set(key, copy);
    }
    cards.push(copy);
  }
  if (moved.size === 0) return state;
  return {
    ...state,
    cards,
    usage: state.usage.map((u) => (moved.has(u.cardId) ? { ...u, cardId: moved.get(u.cardId)! } : u)),
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

/** "Gold Card", then "Gold Card 2", "Gold Card 3"… so duplicate cards can be told apart. */
export function uniqueName(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}

export function cardFromCatalog(catalogId: string, anniversaryMonth: number, existingNames: string[] = []): UserCard | null {
  const c = findCatalogCard(catalogId);
  if (!c) return null;
  return {
    id: uid(),
    catalogId: c.id,
    name: uniqueName(c.name, existingNames),
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
  if (benefit.oneTime) return oneTimeStatus(card, benefit, usage, today);
  const period = getBenefitPeriod(benefit, today, card.anniversaryMonth);
  const available = round2(amountFor(benefit, today) * cardCount(card));
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
  const available = round2(benefit.amount * cardCount(card));
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

/** Activate-once perks: done forever once checked off; due by `endsAfter` if set. */
function oneTimeStatus(card: UserCard, benefit: Benefit, usage: UsageEntry[], today: Date): BenefitStatus {
  const entries = usage.filter((u) => u.cardId === card.id && u.benefitId === benefit.id);
  const deadline = benefit.endsAfter ? new Date(`${benefit.endsAfter}T00:00:00`) : null;
  const period: Period = {
    key: 'once',
    start: new Date(2000, 0, 1),
    end: deadline ?? new Date(9999, 0, 1),
    label: deadline ? `Activate by ${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Activate once',
  };
  // Checked off = done, whatever amount was logged (some perks have no dollar value).
  const done = entries.length > 0;
  const available = round2(benefit.amount * cardCount(card));
  return {
    card,
    benefit,
    period,
    available,
    used: done ? available : 0,
    remaining: done ? 0 : available,
    daysLeft: deadline ? daysLeft(period, today) : Number.MAX_SAFE_INTEGER,
    entries,
  };
}

/** False once a limited-time credit's last day has passed. */
export function isActive(b: Benefit, today: Date): boolean {
  if (!b.endsAfter) return true;
  const [y, m, d] = b.endsAfter.split('-').map(Number);
  return today <= new Date(y, m - 1, d, 23, 59, 59);
}

export function allStatuses(state: AppState, today: Date): BenefitStatus[] {
  return state.cards.flatMap((card) =>
    card.benefits
      .filter((b) => !card.hiddenBenefitIds.includes(b.id) && isActive(b, today))
      .map((b) => benefitStatus(card, b, state.usage, today)),
  );
}

/** Whether a credit is used up for now. Activate-once perks count as done once checked off. */
export const isDone = (s: BenefitStatus) => (s.benefit.oneTime ? s.entries.length > 0 : s.remaining <= 0);

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const money = (n: number) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
