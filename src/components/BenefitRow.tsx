import { useState } from 'react';
import type { BenefitStatus } from '../lib/store';
import { money } from '../lib/store';
import { FREQUENCY_LABEL } from '../lib/periods';

interface Props {
  status: BenefitStatus;
  showCard?: boolean;
  remindDays: number;
  onLog: (amount: number, note?: string) => void;
  onUndo: (entryId: string) => void;
}

export function BenefitRow({ status, showCard, remindDays, onLog, onUndo }: Props) {
  const { benefit, card, used, available, remaining, daysLeft, period, entries } = status;
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const pct = available > 0 ? Math.round((used / available) * 100) : 0;
  const done = remaining <= 0;
  const urgent = !done && daysLeft <= remindDays;

  const submit = () => {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    onLog(Math.min(n, remaining));
    setAmount('');
    setOpen(false);
  };

  return (
    <div className={`benefit ${done ? 'is-done' : ''} ${urgent ? 'is-urgent' : ''}`}>
      <div className="benefit-head">
        <div className="benefit-title">
          {showCard && (
            <span className="chip" style={{ background: card.color }}>
              {card.name}
            </span>
          )}
          <strong>{benefit.name}</strong>
          <span className="muted small">
            {FREQUENCY_LABEL[benefit.frequency]} · {period.label}
          </span>
        </div>
        <div className="benefit-amount">
          <span className={done ? 'ok' : ''}>{done ? 'Used ✓' : `${money(remaining)} left`}</span>
          <span className={`small ${urgent ? 'warn' : 'muted'}`}>
            {done ? `${money(available)} captured` : daysLeft === 0 ? 'Expires today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
          </span>
        </div>
      </div>

      <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${benefit.name} used`}>
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="benefit-foot">
        <span className="muted small">
          {money(used)} of {money(available)} used
        </span>
        <div className="actions">
          {!done && (
            <>
              <button className="btn small" onClick={() => onLog(remaining)}>
                Used it all
              </button>
              <button className="btn small ghost" onClick={() => setOpen((o) => !o)}>
                Log partial
              </button>
            </>
          )}
          {entries.length > 0 && (
            <button className="btn small ghost" onClick={() => onUndo(entries[entries.length - 1].id)} title="Undo last entry">
              Undo
            </button>
          )}
        </div>
      </div>

      {open && (
        <form
          className="log-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder={`Amount (up to ${money(remaining)})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
          <button className="btn small" type="submit">
            Save
          </button>
        </form>
      )}
      {benefit.howTo && !done && <p className="howto small muted">{benefit.howTo}</p>}
    </div>
  );
}
