import { useState } from 'react';
import type { Benefit, Category, Frequency, UserCard } from '../types';
import { FREQUENCY_LABEL, yearlyValue } from '../lib/periods';
import { money, uid, type BenefitStatus } from '../lib/store';
import { BenefitRow } from './BenefitRow';
import { MONTH_NAMES } from './util';

interface Props {
  card: UserCard;
  statuses: BenefitStatus[];
  capturedThisYear: number;
  remindDays: number;
  onChange: (card: UserCard) => void;
  onRemove: () => void;
  onLog: (s: BenefitStatus, amount: number) => void;
  onUndo: (entryId: string) => void;
}

const CATEGORIES: Category[] = ['dining', 'rideshare', 'travel', 'hotel', 'airline', 'entertainment', 'shopping', 'fitness', 'other'];

export function CardDetail({ card, statuses, capturedThisYear, remindDays, onChange, onRemove, onLog, onUndo }: Props) {
  const [editing, setEditing] = useState(card.benefits.length === 0);
  const visible = card.benefits.filter((b) => !card.hiddenBenefitIds.includes(b.id));
  const yearly = visible.reduce((s, b) => s + yearlyValue(b), 0);
  const fee = card.annualFee;

  return (
    <section className="card-panel">
      <div className="card-face" style={{ background: `linear-gradient(135deg, ${card.color}, #111a)` }}>
        <div>
          <div className="small">{card.issuer}</div>
          <div className="card-name">{card.name}</div>
        </div>
        <div className="card-stats">
          <div>
            <div className="small">Captured {new Date().getFullYear()}</div>
            <div className="big">{money(capturedThisYear)}</div>
          </div>
          <div>
            <div className="small">Credits / yr</div>
            <div className="big">{money(yearly)}</div>
          </div>
          {fee > 0 && (
            <div>
              <div className="small">Fee</div>
              <div className="big">{money(fee)}</div>
            </div>
          )}
        </div>
        {fee > 0 && (
          <div className="fee-bar" title="Progress toward earning back the annual fee">
            <div style={{ width: `${Math.min(100, (capturedThisYear / fee) * 100)}%` }} />
            <span className="small">
              {capturedThisYear >= fee ? 'Annual fee earned back 🎉' : `${money(fee - capturedThisYear)} more to earn back the fee`}
            </span>
          </div>
        )}
      </div>

      {!editing ? (
        <>
          <div className="list">
            {statuses.map((s) => (
              <BenefitRow
                key={s.benefit.id}
                status={s}
                remindDays={remindDays}
                onLog={(amt) => onLog(s, amt)}
                onUndo={onUndo}
              />
            ))}
            {statuses.length === 0 && <p className="muted center">No credits tracked on this card yet.</p>}
          </div>
          <div className="row">
            <button className="btn ghost" onClick={() => setEditing(true)}>
              Edit credits
            </button>
          </div>
        </>
      ) : (
        <EditCard card={card} onChange={onChange} onDone={() => setEditing(false)} onRemove={onRemove} />
      )}
    </section>
  );
}

function EditCard({
  card,
  onChange,
  onDone,
  onRemove,
}: {
  card: UserCard;
  onChange: (c: UserCard) => void;
  onDone: () => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState<Partial<Benefit>>({ frequency: 'monthly', category: 'dining' });

  const toggle = (id: string) =>
    onChange({
      ...card,
      hiddenBenefitIds: card.hiddenBenefitIds.includes(id)
        ? card.hiddenBenefitIds.filter((x) => x !== id)
        : [...card.hiddenBenefitIds, id],
    });

  const setAmount = (id: string, amount: number) =>
    onChange({ ...card, benefits: card.benefits.map((b) => (b.id === id ? { ...b, amount, monthOverrides: undefined } : b)) });

  const addBenefit = () => {
    if (!draft.name?.trim() || !draft.amount || draft.amount <= 0) return;
    const b: Benefit = {
      id: `custom-${uid()}`,
      name: draft.name.trim(),
      amount: draft.amount,
      frequency: draft.frequency as Frequency,
      resetBasis: draft.frequency === 'annual' ? draft.resetBasis ?? 'calendar' : undefined,
      category: draft.category as Category,
    };
    onChange({ ...card, benefits: [...card.benefits, b] });
    setDraft({ frequency: 'monthly', category: 'dining' });
  };

  return (
    <div className="stack edit">
      <label>
        Account anniversary month
        <select value={card.anniversaryMonth} onChange={(e) => onChange({ ...card, anniversaryMonth: Number(e.target.value) })}>
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label>
        Annual fee
        <input
          type="number"
          min="0"
          value={card.annualFee}
          onChange={(e) => onChange({ ...card, annualFee: Number(e.target.value) || 0 })}
        />
      </label>

      <h3>Credits</h3>
      <p className="muted small">Uncheck credits you don't care about. Amounts are editable if your card's terms differ.</p>
      <ul className="edit-list">
        {card.benefits.map((b) => (
          <li key={b.id}>
            <label className="check">
              <input type="checkbox" checked={!card.hiddenBenefitIds.includes(b.id)} onChange={() => toggle(b.id)} />
              <span className="grow">
                {b.name}
                <br />
                <span className="muted small">
                  {FREQUENCY_LABEL[b.frequency]}
                  {b.resetBasis === 'anniversary' ? ' (anniversary)' : ''}
                  {b.monthOverrides ? ' · varies by month' : ''}
                </span>
              </span>
            </label>
            <input
              className="amount"
              type="number"
              min="0"
              step="0.01"
              value={b.amount}
              aria-label={`${b.name} amount`}
              onChange={(e) => setAmount(b.id, Number(e.target.value) || 0)}
            />
            {b.id.startsWith('custom-') && (
              <button
                className="btn ghost small"
                aria-label={`Delete ${b.name}`}
                onClick={() => onChange({ ...card, benefits: card.benefits.filter((x) => x.id !== b.id) })}
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>

      <h3>Add a credit</h3>
      <div className="add-benefit">
        <input placeholder="Name (e.g. Saks credit)" value={draft.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="$ per period"
          value={draft.amount ?? ''}
          onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
        />
        <select value={draft.frequency} onChange={(e) => setDraft({ ...draft, frequency: e.target.value as Frequency })}>
          {(Object.keys(FREQUENCY_LABEL) as Frequency[]).map((f) => (
            <option key={f} value={f}>
              {FREQUENCY_LABEL[f]}
            </option>
          ))}
        </select>
        {draft.frequency === 'annual' && (
          <select value={draft.resetBasis ?? 'calendar'} onChange={(e) => setDraft({ ...draft, resetBasis: e.target.value as 'calendar' | 'anniversary' })}>
            <option value="calendar">Resets Jan 1</option>
            <option value="anniversary">Resets on anniversary</option>
          </select>
        )}
        <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as Category })}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c[0].toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <button className="btn" onClick={addBenefit}>
          Add
        </button>
      </div>

      <div className="row spread">
        <button
          className="btn danger ghost"
          onClick={() => {
            if (confirm(`Remove ${card.name} and its history?`)) onRemove();
          }}
        >
          Remove card
        </button>
        <button className="btn" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}
