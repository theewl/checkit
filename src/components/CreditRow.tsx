import { useState } from 'react';
import { cardCount, displayName, isDone, money, type BenefitStatus } from '../lib/store';

interface Props {
  status: BenefitStatus;
  remindDays: number;
  /** Hide the card name when the row already sits under its card's heading. */
  showCard?: boolean;
  onLog: (amount: number) => void;
  onClear: (entryIds: string[]) => void;
}

const shortDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** One credit: tap the circle to mark it used, tap the row for details. */
export function CreditRow({ status, remindDays, showCard = true, onLog, onClear }: Props) {
  const { benefit, card, used, available, remaining, daysLeft, period, entries } = status;
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const done = isDone(status);
  const urgent = !done && daysLeft <= remindDays;
  const noDeadline = daysLeft > 100_000;

  const nextReset = new Date(period.end.getFullYear(), period.end.getMonth(), period.end.getDate() + 1);
  const once = !!benefit.oneTime;
  const when = once && done
    ? 'Activated'
    : once && noDeadline
      ? 'Activate once'
      : done
    ? `Resets ${shortDate(nextReset)}`
    : noDeadline
      ? 'No deadline'
      : daysLeft === 0
        ? 'Last day!'
        : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;

  const savePartial = () => {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    onLog(Math.min(n, remaining));
    setAmount('');
    setOpen(false);
  };

  return (
    <li className={`credit ${done ? 'done' : ''} ${urgent ? 'urgent' : ''}`}>
      <div className="credit-line">
        <button
          className="check"
          aria-label={done ? `Mark ${benefit.name} not used` : `Mark ${benefit.name} used`}
          onClick={() => (done ? onClear(entries.map((e) => e.id)) : onLog(remaining))}
        >
          {done ? '✓' : ''}
        </button>
        <button className="credit-main" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className="credit-name">{benefit.name}</span>
          <span className="credit-sub">
            {showCard && (
              <>
                <span className="dot" style={{ background: card.color }} />
                {displayName(card)} ·{' '}
              </>
            )}
            <span className={urgent ? 'warn' : ''}>{when}</span>
          </span>
        </button>
        <span className="credit-amt">
          {benefit.estimated ? '~' : ''}
          {available < 0.01 ? (done ? '✓' : 'Enroll') : money(done ? available : remaining)}
        </span>
      </div>

      {!done && used > 0 && (
        <div className="mini-bar" title={`${money(used)} of ${money(available)} used`}>
          <div style={{ width: `${(used / available) * 100}%` }} />
        </div>
      )}

      {open && (
        <div className="credit-more">
          {cardCount(card) > 1 && (
            <p>
              <strong>
                {cardCount(card)} cards × {money(available / cardCount(card))} = {money(available)}
              </strong>
            </p>
          )}
          {benefit.howTo && <p>{benefit.howTo}</p>}
          <p className="muted">
            {once ? (done ? 'Activated — nothing more to do.' : period.label) : `${money(used)} of ${money(available)} used · resets ${shortDate(nextReset)}`}
          </p>
          {!done && !once && (
            <form
              className="partial"
              onSubmit={(e) => {
                e.preventDefault();
                savePartial();
              }}
            >
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="Used part of it? Enter $"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button className="btn small" type="submit">
                Save
              </button>
            </form>
          )}
          {entries.length > 0 && (
            <button className="link" onClick={() => onClear(entries.map((e) => e.id))}>
              Reset this credit to unused
            </button>
          )}
        </div>
      )}
    </li>
  );
}
