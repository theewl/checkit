export type Frequency = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

/** How an annual benefit resets: on Jan 1 or on the card's account anniversary. */
export type ResetBasis = 'calendar' | 'anniversary';

export type Category =
  | 'rideshare'
  | 'dining'
  | 'travel'
  | 'hotel'
  | 'airline'
  | 'entertainment'
  | 'shopping'
  | 'fitness'
  | 'other';

export interface Benefit {
  id: string;
  name: string;
  /** Dollar value available each period. */
  amount: number;
  frequency: Frequency;
  resetBasis?: ResetBasis;
  /**
   * Multi-year credits (e.g. Global Entry every 4 years). The cycle starts when you
   * use it, so frequency/resetBasis are ignored when this is set.
   */
  everyYears?: number;
  /** Last day the credit exists (YYYY-MM-DD), for limited-time credits. Hidden after that. */
  endsAfter?: string;
  /** A certificate or perk with an estimated value (e.g. a free night), not a fixed statement credit. */
  estimated?: boolean;
  /** Per-month amount overrides for monthly benefits, e.g. { 12: 35 } for a bigger December Uber credit. */
  monthOverrides?: Record<number, number>;
  category: Category;
  /** Short hint on how to use it. */
  howTo?: string;
}

export interface CatalogCard {
  id: string;
  name: string;
  issuer: string;
  annualFee: number;
  color: string;
  benefits: Benefit[];
}

/** A card the user owns. */
export interface UserCard {
  id: string;
  /** Catalog card id, or null for a fully custom card. */
  catalogId: string | null;
  name: string;
  issuer: string;
  color: string;
  annualFee: number;
  /** 1-12. Used for anniversary-based benefits. */
  anniversaryMonth: number;
  benefits: Benefit[];
  hiddenBenefitIds: string[];
  /** How many of this card you hold (default 1). Credits are multiplied and tracked together. */
  count?: number;
  /** Catalog benefit ids (and '__fee') the user edited, which catalog updates must not overwrite. */
  editedIds?: string[];
}

export interface UsageEntry {
  id: string;
  cardId: string;
  benefitId: string;
  periodKey: string;
  amount: number;
  /** ISO date the usage was logged. */
  date: string;
  note?: string;
}

export interface Settings {
  /** Remind when a period ends within this many days and money is left. */
  remindDaysBefore: number;
  /** List credits grouped by card (default) or as one list by soonest deadline. */
  sortBy?: 'card' | 'due';
  notificationsEnabled: boolean;
}

export interface AppState {
  cards: UserCard[];
  usage: UsageEntry[];
  settings: Settings;
  /** Period keys already notified, so each reminder fires once. */
  notified: string[];
}
