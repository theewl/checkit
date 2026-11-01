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
    return {
      ...DEFAULT_STATE,
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
    };
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
