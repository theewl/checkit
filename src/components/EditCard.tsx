import { useState } from 'react';
import type { Benefit, Category, Frequency, UserCard } from '../types';
import { FREQUENCY_LABEL } from '../lib/periods';
import { uid } from '../lib/store';
import { MONTH_NAMES } from './util';

const CATEGORIES: Category[] = ['dining', 'rideshare', 'travel', 'hotel', 'airline', 'entertainment', 'shopping', 'fitness', 'other'];

/** Edit a card: anniversary month, fee, which credits to track, amounts, and custom credits. */
export function EditCard({
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

  const markEdited = (id: string) => [...new Set([...(card.editedIds ?? []), id])];
  const setAmount = (id: string, amount: number) =>
    onChange({
      ...card,
      editedIds: markEdited(id),
      benefits: card.benefits.map((b) => (b.id === id ? { ...b, amount, monthOverrides: undefined } : b)),
    });

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
        Card name
        <input value={card.name} onChange={(e) => onChange({ ...card, name: e.target.value })} placeholder="e.g. Gold – Mine" />
      </label>
      <div className="count-row">
        <span>How many of this card do you have?</span>
        <div className="stepper">
          <button
            className="btn ghost small"
            aria-label="One fewer"
            disabled={(card.count ?? 1) <= 1}
            onClick={() => onChange({ ...card, count: Math.max(1, (card.count ?? 1) - 1) })}
          >
            −
          </button>
          <strong>{card.count ?? 1}</strong>
          <button className="btn ghost small" aria-label="One more" onClick={() => onChange({ ...card, count: (card.count ?? 1) + 1 })}>
            +
          </button>
        </div>
      </div>
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
          onChange={(e) => onChange({ ...card, annualFee: Number(e.target.value) || 0, editedIds: markEdited('__fee') })}
        />
      </label>

      <h3>Credits</h3>
      <p className="muted small">Uncheck credits you don't care about. Amounts are editable if your card's terms differ.</p>
      <ul className="edit-list">
        {card.benefits.map((b) => (
          <li key={b.id}>
            <label className="check-label">
              <input type="checkbox" checked={!card.hiddenBenefitIds.includes(b.id)} onChange={() => toggle(b.id)} />
              <span className="grow">
                {b.name}
                <br />
                <span className="muted small">
                  {b.everyYears ? `Every ${b.everyYears} years` : FREQUENCY_LABEL[b.frequency]}
                  {!b.everyYears && b.resetBasis === 'anniversary' ? ' (anniversary)' : ''}
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
