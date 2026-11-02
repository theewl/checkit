import type { Benefit, UserCard } from '../types';

/**
 * Statement import: read a transactions CSV downloaded from a card issuer's website,
 * find the statement credits in it, and suggest which tracked credit each one is.
 * Everything runs in the browser; the file never leaves the device.
 *
 * Supported layouts (by header names, so column order does not matter):
 *   Amex:        Date, Description, Amount            (charges +, credits -)
 *   Chase:       Transaction Date, Description, Amount (charges -, credits +)
 *   Citi:        Date, Description, Debit, Credit
 *   Capital One: Transaction Date, Description, Debit, Credit
 */

export interface Txn {
  date: Date;
  description: string;
  /** Always positive. */
  amount: number;
  isCredit: boolean;
}

/** Minimal RFC 4180 CSV parser: quoted fields, escaped quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) rows.push(row);
  return rows;
}

function parseDate(s: string): Date | null {
  const t = s.trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    return new Date(y, +m[1] - 1, +m[2]);
  }
  return null;
}

/** "$1,234.50" → 1234.5, "(12.00)" → -12. Empty → null. */
function parseAmount(s: string | undefined): number | null {
  if (s == null) return null;
  const t = s.trim();
  if (!t) return null;
  const neg = /^\(.*\)$/.test(t) || t.startsWith('-');
  const n = parseFloat(t.replace(/[()$,\s-]/g, ''));
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

const find = (header: string[], ...names: string[]) => {
  const h = header.map((x) => x.trim().toLowerCase());
  for (const n of names) {
    const i = h.indexOf(n);
    if (i >= 0) return i;
  }
  return -1;
};

export function readTransactions(text: string): Txn[] {
  const rows = parseCsv(text.replace(/^﻿/, ''));
  // The header is the first row that names a date column (some exports have preamble lines).
  const hi = rows.findIndex((r) => find(r, 'date', 'transaction date', 'trans. date', 'posted date', 'post date') >= 0);
  if (hi < 0) throw new Error('Could not find a header row with a Date column.');
  const header = rows[hi];
  const iDate = find(header, 'transaction date', 'trans. date', 'date', 'posted date', 'post date');
  const iDesc = find(header, 'description', 'merchant', 'payee', 'name');
  const iAmt = find(header, 'amount');
  const iDebit = find(header, 'debit');
  const iCredit = find(header, 'credit');
  if (iDesc < 0 || (iAmt < 0 && iCredit < 0)) throw new Error('Could not find Description and Amount columns.');

  const raw = rows.slice(hi + 1).flatMap((r) => {
    const date = parseDate(r[iDate] ?? '');
    if (!date) return [];
    const description = (r[iDesc] ?? '').trim();
    if (iCredit >= 0 && (iAmt < 0 || !r[iAmt]?.trim())) {
      const credit = parseAmount(r[iCredit]);
      const debit = parseAmount(r[iDebit]);
      if (credit) return [{ date, description, signed: 0, amount: Math.abs(credit), isCredit: true }];
      if (debit) return [{ date, description, signed: 0, amount: Math.abs(debit), isCredit: false }];
      return [];
    }
    const signed = parseAmount(r[iAmt]);
    if (!signed) return [];
    return [{ date, description, signed, amount: Math.abs(signed), isCredit: false }];
  });

  // Single Amount column: issuers disagree on the sign of charges (Amex +, Chase -).
  // Best signal: a card payment always reduces the balance, so it has the credit sign.
  // Next: a Type column marking purchases as "Sale" (Chase), then the sign of rows that
  // mention "credit". Last resort: purchases are
  // usually the majority, so the minority sign is credits.
  const signedRows = raw.filter((t) => t.signed !== 0);
  if (signedRows.length) {
    const iType = find(header, 'type');
    const payment = signedRows.find((t) => PAYMENT_WORDS.test(t.description));
    const saleRow = iType >= 0 ? rows.slice(hi + 1).find((r) => /^sale$/i.test((r[iType] ?? '').trim())) : undefined;
    const saleSign = saleRow ? parseAmount(saleRow[iAmt]) : null;
    let chargesPositive: boolean;
    const creditish = signedRows.filter((t) => CREDIT_WORDS.test(t.description));
    const creditNeg = creditish.filter((t) => t.signed < 0).length;
    if (payment) chargesPositive = payment.signed < 0;
    else if (saleSign) chargesPositive = saleSign > 0;
    // Rows that say "credit" are almost always credits, so they reveal the credit sign.
    else if (creditish.length && creditNeg !== creditish.length - creditNeg) chargesPositive = creditNeg > creditish.length - creditNeg;
    else {
      const positives = signedRows.filter((t) => t.signed > 0).length;
      chargesPositive = positives >= signedRows.length - positives;
    }
    for (const t of signedRows) t.isCredit = chargesPositive ? t.signed < 0 : t.signed > 0;
  }
  return raw.map(({ date, description, amount, isCredit }) => ({ date, description, amount, isCredit }));
}

/** Words that show up in statement-credit descriptions (and not in merchant refunds). */
const CREDIT_WORDS = /credit|statement|adjust|rebate|benefit|reward|offer|cash back/i;
const PAYMENT_WORDS = /payment|autopay|thank you|interest|balance transfer/i;

/** Description keywords for each tracked credit, keyed by benefit id. Longest match wins. */
const KEYWORDS: Record<string, string[]> = {
  uber: ['uber cash', 'uber'],
  'uber-one': ['uber one'],
  resy: ['resy'],
  'digital-ent': ['digital entertainment', 'entertainment'],
  lululemon: ['lululemon'],
  hotel: ['hotel', 'fhr', 'fine hotels', 'chase travel', 'citi travel', 'bilt travel'],
  'hotel-2026': ['select hotel', 'hotel'],
  airline: ['airline', 'incidental'],
  walmart: ['walmart'],
  equinox: ['equinox'],
  oura: ['oura'],
  clear: ['clear'],
  'global-entry': ['global entry', 'tsa', 'precheck', 'nexus'],
  dining: ['dining', 'exclusive tables'],
  dunkin: ['dunkin'],
  dell: ['dell'],
  adobe: ['adobe'],
  indeed: ['indeed'],
  wireless: ['wireless'],
  hilton: ['hilton'],
  chatgpt: ['chatgpt', 'openai'],
  disney: ['disney', 'hulu', 'espn'],
  'home-chef': ['home chef'],
  resort: ['resort'],
  flight: ['flight'],
  stays: ['delta stays', 'stays'],
  rideshare: ['rideshare'],
  travel: ['travel credit', 'travel'],
  edit: ['the edit', 'edit'],
  stubhub: ['stubhub', 'viagogo'],
  doordash: ['doordash'],
  lyft: ['lyft'],
  peloton: ['peloton'],
  ziprecruiter: ['ziprecruiter'],
  google: ['google'],
  instacart: ['instacart'],
  jsx: ['jsx'],
  hotels: ['renowned', 'united hotels', 'hotel'],
  avis: ['avis', 'budget'],
  united: ['united', 'travelbank'],
  food: ['food', 'beverage'],
  splurge: ['splurge'],
  blacklane: ['blacklane'],
  inkind: ['inkind'],
  inflight: ['inflight', 'admirals'],
  'aa-vacations': ['vacations'],
  'bilt-cash': ['bilt cash'],
};

function keywordsFor(b: Benefit): string[] {
  if (KEYWORDS[b.id]) return KEYWORDS[b.id];
  // Custom credits: use the meaningful words of their name.
  return b.name
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((w) => w.length > 3 && !['credit', 'card', 'membership', 'activate', 'enroll'].includes(w));
}

export interface Suggestion {
  txn: Txn;
  /** Stable id for this transaction on this card, so overlapping files don't double count. */
  key: string;
  /** Already checked off by an earlier import. */
  already?: boolean;
  /** Best-matching benefit on the card, or null if none matched. */
  benefitId: string | null;
}

/** Statement credits in the file, each with the tracked credit it most likely is. */
export function suggestMatches(card: UserCard, txns: Txn[], existingIds: Set<string> = new Set()): Suggestion[] {
  const seen = new Map<string, number>();
  const benefits = card.benefits.filter((b) => !card.hiddenBenefitIds.includes(b.id));
  return txns
    .filter((t) => t.isCredit && CREDIT_WORDS.test(t.description) && !PAYMENT_WORDS.test(t.description))
    .map((txn) => {
      const desc = txn.description.toLowerCase();
      let best: { id: string; len: number } | null = null;
      for (const b of benefits) {
        for (const k of keywordsFor(b)) {
          if (desc.includes(k) && (!best || k.length > best.len)) best = { id: b.id, len: k.length };
        }
      }
      // Same date, amount and description = same transaction, even across files.
      // A counter keeps genuinely repeated identical rows within one file distinct.
      const ymd = `${txn.date.getFullYear()}${txn.date.getMonth() + 1}-${txn.date.getDate()}`;
      const base = `imp-${card.id}-${ymd}-${Math.round(txn.amount * 100)}-${fileHash(desc.trim())}`;
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      const key = `${base}-${n}`;
      const already = existingIds.has(key);
      return { txn, key, already, benefitId: already ? null : best?.id ?? null };
    });
}

/**
 * The most recent annual fee charge in the file. Issuers bill it around the account
 * anniversary, so its month is the card's anniversary month.
 */
export function findAnnualFee(txns: Txn[]): Txn | null {
  const fees = txns
    .filter((t) => !t.isCredit && /annual (membership )?fee|membership fee/i.test(t.description) && !/waive|revers/i.test(t.description))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  return fees[0] ?? null;
}

/** Small stable hash (FNV-1a) used to recognise a file that was already imported. */
export function fileHash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
