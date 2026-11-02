import type { AppState, Frequency, UserCard } from '../types';
import { allStatuses, isDone, cardCount, displayName, isActive, money, type BenefitStatus } from './store';

/** Benefits with money left whose period ends within `days` days. Soonest first. */
export function expiringSoon(statuses: BenefitStatus[], days: number): BenefitStatus[] {
  return statuses
    .filter((s) => !isDone(s) && s.daysLeft <= days)
    .sort((a, b) => a.daysLeft - b.daysLeft || b.remaining - a.remaining);
}

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  const res = await Notification.requestPermission();
  return res === 'granted';
}

/**
 * Fire a browser notification for each expiring benefit not yet notified this period.
 * Returns the notification keys that were sent so the caller can persist them.
 */
export function sendDueNotifications(state: AppState, today: Date): string[] {
  if (!state.settings.notificationsEnabled || !notificationsSupported()) return [];
  if (Notification.permission !== 'granted') return [];

  const due = expiringSoon(allStatuses(state, today), state.settings.remindDaysBefore);
  const sent: string[] = [];
  for (const s of due) {
    const key = `${s.card.id}:${s.benefit.id}:${s.period.key}`;
    if (state.notified.includes(key)) continue;
    const when = s.daysLeft === 0 ? 'today' : `in ${s.daysLeft} day${s.daysLeft === 1 ? '' : 's'}`;
    try {
      new Notification(`${money(s.remaining)} ${s.benefit.name} expires ${when}`, {
        body: `${s.card.issuer} ${displayName(s.card)}${s.benefit.howTo ? ` — ${s.benefit.howTo}` : ''}`,
        tag: key,
      });
      sent.push(key);
    } catch {
      // Some mobile browsers only allow notifications via a service worker.
    }
  }
  return sent;
}

/* ---------- Calendar (.ics) export: recurring reminders that work on any phone ---------- */

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Fold lines longer than 75 octets (RFC 5545 §3.1); some calendar apps reject unfolded lines. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (enc.encode(cur + ch).length > limit) {
      out.push(cur);
      cur = '';
    }
    cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

/**
 * First reminder date on/after `from`: `daysBefore` days before the last day of a month
 * that ends a period. Period-ending months are `endMonth0`, then every `stepMonths` after.
 */
export function firstReminder(endMonth0: number, from: Date, daysBefore: number, stepMonths: number): Date {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let y = from.getFullYear();
  let m = endMonth0 % stepMonths; // earliest period-ending month in the year
  for (;;) {
    const last = new Date(y, m + 1, 0);
    const reminder = new Date(y, m, last.getDate() - daysBefore);
    if (reminder >= today) return reminder;
    m += stepMonths;
    if (m > 11) {
      m -= 12;
      y += 1;
    }
  }
}

interface Group {
  card: UserCard;
  frequency: Frequency;
  anniversary: boolean;
  lines: string[];
}

/**
 * Build an .ics file with one recurring event per card per reset schedule, placed
 * `daysBefore` days before each period ends. Monthly events use BYMONTHDAY=-N so they
 * land correctly in short and long months.
 */
export function buildIcs(state: AppState, today: Date): string {
  const daysBefore = Math.max(1, Math.min(27, state.settings.remindDaysBefore));
  const groups = new Map<string, Group>();

  for (const card of state.cards) {
    for (const b of card.benefits) {
      // Multi-year credits have no fixed reset date to remind about.
      if (card.hiddenBenefitIds.includes(b.id) || b.everyYears || b.oneTime || !isActive(b, today)) continue;
      const anniversary = b.frequency === 'annual' && b.resetBasis === 'anniversary';
      const key = `${card.id}|${b.frequency}|${anniversary}`;
      if (!groups.has(key)) groups.set(key, { card, frequency: b.frequency, anniversary, lines: [] });
      groups.get(key)!.lines.push(`• ${b.name}: ${money(b.amount * cardCount(card))}${b.howTo ? ` — ${b.howTo}` : ''}`);
    }
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const events: string[] = [];
  for (const [key, g] of groups) {
    const byMonthDay = -(daysBefore + 1); // -1 is the last day of the month
    let rrule: string;
    let start: Date;
    let label: string;
    switch (g.frequency) {
      case 'monthly':
        rrule = `FREQ=MONTHLY;BYMONTHDAY=${byMonthDay}`;
        start = firstReminder(today.getMonth(), today, daysBefore, 1);
        label = 'monthly';
        break;
      case 'quarterly':
        rrule = `FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=${byMonthDay}`;
        start = firstReminder(2, today, daysBefore, 3);
        label = 'quarterly';
        break;
      case 'semiannual':
        rrule = `FREQ=MONTHLY;INTERVAL=6;BYMONTHDAY=${byMonthDay}`;
        start = firstReminder(5, today, daysBefore, 6);
        label = 'semiannual';
        break;
      case 'annual': {
        const endMonth0 = g.anniversary ? (g.card.anniversaryMonth + 10) % 12 : 11;
        rrule = `FREQ=YEARLY;BYMONTH=${endMonth0 + 1};BYMONTHDAY=${byMonthDay}`;
        start = firstReminder(endMonth0, today, daysBefore, 12);
        label = g.anniversary ? 'anniversary-year' : 'yearly';
        break;
      }
    }
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    events.push(
      [
        'BEGIN:VEVENT',
        `UID:checkit-${key.replace(/\|/g, '-')}@checkit`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${ymd(start)}`,
        `DTEND;VALUE=DATE:${ymd(end)}`,
        `RRULE:${rrule}`,
        `SUMMARY:${icsEscape(`Use ${displayName(g.card)} ${label} credits`)}`,
        `DESCRIPTION:${icsEscape(`Credits reset in ${daysBefore} days:\n${g.lines.join('\n')}`)}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${icsEscape(`${displayName(g.card)} credits expiring soon`)}`,
        'TRIGGER:PT9H',
        'END:VALARM',
        'END:VEVENT',
      ]
        .map(foldLine)
        .join('\r\n'),
    );
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//checkit//benefits//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Card credits',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
