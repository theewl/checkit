import { useMemo, useState } from 'react';
import { CATALOG } from '../data/cards';
import { yearlyValue } from '../lib/periods';
import { money, uid } from '../lib/store';
import type { UserCard } from '../types';
import { MONTH_NAMES } from './util';

interface Props {
  ownedCatalogIds: string[];
  onAdd: (catalogId: string, anniversaryMonth: number) => void;
  onAddCustom: (card: UserCard) => void;
  onClose: () => void;
}

export function AddCard({ ownedCatalogIds, onAdd, onAddCustom, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [custom, setCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customIssuer, setCustomIssuer] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((c) => !q || `${c.issuer} ${c.name}`.toLowerCase().includes(q));
  }, [query]);

  const needsAnniversary = (id: string) =>
    CATALOG.find((c) => c.id === id)?.benefits.some((b) => b.resetBasis === 'anniversary');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Add a card">
        <div className="modal-head">
          <h2>Add a card</h2>
          <button className="btn ghost small" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {!custom ? (
          <>
            <input
              className="search"
              placeholder="Search cards (e.g. Platinum, Sapphire)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <ul className="catalog">
              {results.map((c) => {
                const value = c.benefits.reduce((s, b) => s + yearlyValue(b), 0);
                const owned = ownedCatalogIds.includes(c.id);
                return (
                  <li key={c.id}>
                    <button
                      className={`catalog-item ${selected === c.id ? 'selected' : ''}`}
                      onClick={() => (needsAnniversary(c.id) || owned ? setSelected(c.id) : onAdd(c.id, month))}
                    >
                      <span className="swatch" style={{ background: c.color }} />
                      <span className="grow">
                        <strong>{c.name}</strong>
                        <span className="muted small"> · {c.issuer}</span>
                        <br />
                        <span className="muted small">
                          {c.benefits.length} credit{c.benefits.length === 1 ? '' : 's'} · about {money(Math.round(value))}/yr
                          {owned ? ' · already added' : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {selected && (
              <div className="add-confirm">
                {ownedCatalogIds.includes(selected) && (
                  <p className="notice small">
                    You already added this card. Add another one (for example a second account or a partner's card)?
                  </p>
                )}
                {needsAnniversary(selected) && (
                  <label>
                    When did you open this card? (month)
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                      {MONTH_NAMES.map((m, i) => (
                        <option key={m} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <span className="muted small">Some of this card's credits reset on your card anniversary.</span>
                  </label>
                )}
                <button className="btn" onClick={() => onAdd(selected, month)}>
                  {ownedCatalogIds.includes(selected) ? 'Add another' : 'Add card'}
                </button>
              </div>
            )}

            <p className="muted small center">
              Don't see your card?{' '}
              <button className="link" onClick={() => setCustom(true)}>
                Add a custom card
              </button>
            </p>
          </>
        ) : (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (!customName.trim()) return;
              onAddCustom({
                id: uid(),
                catalogId: null,
                name: customName.trim(),
                issuer: customIssuer.trim() || 'Custom',
                color: '#5b6b82',
                annualFee: 0,
                anniversaryMonth: month,
                benefits: [],
                hiddenBenefitIds: [],
              });
            }}
          >
            <label>
              Card name
              <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Business Platinum" autoFocus />
            </label>
            <label>
              Issuer
              <input value={customIssuer} onChange={(e) => setCustomIssuer(e.target.value)} placeholder="e.g. American Express" />
            </label>
            <label>
              Anniversary month
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <p className="muted small">You'll add the card's credits on the next screen.</p>
            <div className="row">
              <button type="button" className="btn ghost" onClick={() => setCustom(false)}>
                Back
              </button>
              <button className="btn" type="submit">
                Create card
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
