import { useState } from 'react';
import { findAnnualFee, readTransactions, suggestMatches, type Suggestion } from '../lib/importCsv';
import { getBenefitPeriod } from '../lib/periods';
import { MONTH_NAMES } from './util';
import { displayName, money, round2 } from '../lib/store';
import type { UsageEntry, UserCard } from '../types';

interface Props {
  cards: UserCard[];
  /** Ids of usage entries already recorded, to skip credits imported before. */
  existingIds: Set<string>;
  /** anniversaryMonth is set when the statement's annual fee showed a different anniversary. */
  onImport: (cardId: string, entries: UsageEntry[], anniversaryMonth?: number) => void;
  onClose: () => void;
}

const HOW_TO: [string, string][] = [
  ['Amex', 'americanexpress.com → Statements & Activity → download icon → CSV'],
  ['Chase', 'chase.com → card account → download icon (↓) → Spreadsheet (CSV)'],
  ['Citi', 'citi.com → card account → Download Transactions → CSV'],
  ['Capital One', 'capitalone.com → card → View transactions → Download → CSV'],
];

/** Pick a card, choose a downloaded CSV, review the statement credits found, and add them. */
export function ImportStatement({ cards, existingIds, onImport, onClose }: Props) {
  const [cardId, setCardId] = useState(cards[0]?.id ?? '');
  const [rows, setRows] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState('');
  const [feeMonth, setFeeMonth] = useState<number | null>(null);
  const [useFeeMonth, setUseFeeMonth] = useState(true);
  const card = cards.find((c) => c.id === cardId);

  const readFile = async (f: File) => {
    setError('');
    setRows(null);
    const text = await f.text();
    try {
      const txns = readTransactions(text);
      const fee = findAnnualFee(txns);
      setFeeMonth(fee ? fee.date.getMonth() + 1 : null);
      setUseFeeMonth(true);
      setRows(suggestMatches(card!, txns, existingIds));
    } catch (e) {
      setError(`Couldn't read that file. Make sure it's a CSV export of card transactions. (${(e as Error).message})`);
    }
  };

  const chosen = (rows ?? []).filter((r) => r.benefitId);
  const feeChanges = !!card && feeMonth !== null && feeMonth !== card.anniversaryMonth;

  const confirm = () => {
    if (!card) return;
    const anniversary = feeChanges && useFeeMonth ? feeMonth! : card.anniversaryMonth;
    const entries: UsageEntry[] = chosen.map((r) => {
      const b = card.benefits.find((x) => x.id === r.benefitId)!;
      const periodKey = b.oneTime ? 'once' : b.everyYears ? 'open' : getBenefitPeriod(b, r.txn.date, anniversary).key;
      return {
        id: r.key,
        cardId: card.id,
        benefitId: b.id,
        periodKey,
        amount: round2(r.txn.amount),
        date: r.txn.date.toISOString(),
        note: r.txn.description,
      };
    });
    onImport(card.id, entries, feeChanges && useFeeMonth ? feeMonth! : undefined);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Import statement">
        <div className="modal-head">
          <h2>Import statement</h2>
          <button className="btn ghost small" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="muted small">
          Download your card's transactions as a CSV file and open it here. We find the statement credits and check them
          off. The file stays on this device.
        </p>

        <label>
          Which card is this statement for?
          <select
            value={cardId}
            onChange={(e) => {
              setCardId(e.target.value);
              setRows(null);
              setError('');
            }}
          >
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {displayName(c)}
              </option>
            ))}
          </select>
        </label>

        <label className="file-pick">
          <span className="btn">Choose CSV file</span>
          <input
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readFile(f);
              e.target.value = '';
            }}
          />
        </label>
        {error && <p className="notice small">{error}</p>}

        {rows && card && (
          <>
            {feeChanges && (
              <label className="check-label notice small">
                <input type="checkbox" checked={useFeeMonth} onChange={(e) => setUseFeeMonth(e.target.checked)} />
                <span>
                  Your annual fee posted in <strong>{MONTH_NAMES[feeMonth! - 1]}</strong>, so that's your card anniversary
                  (it's set to {MONTH_NAMES[card.anniversaryMonth - 1]}). Update it so anniversary credits reset at the right
                  time.
                </span>
              </label>
            )}
            {feeMonth !== null && !feeChanges && (
              <p className="muted small">✓ Annual fee found: card anniversary is {MONTH_NAMES[feeMonth - 1]}, as set.</p>
            )}
            {rows.length === 0 ? (
              <p className="notice small">No statement credits found in this file.</p>
            ) : (
              <>
                <h3>
                  Found {rows.length} statement credit{rows.length === 1 ? '' : 's'}
                  {rows.some((r) => r.already) ? ` (${rows.filter((r) => r.already).length} already added)` : ''}
                </h3>
                <p className="muted small">Check each one is matched to the right credit, or choose "Skip".</p>
                <ul className="import-list">
                  {rows.map((r, i) => (
                    <li key={i}>
                      <div className="row spread">
                        <span className="grow">
                          <strong>{r.txn.description}</strong>
                          <br />
                          <span className="muted small">{r.txn.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </span>
                        <strong>{money(r.txn.amount)}</strong>
                      </div>
                      {r.already ? (
                        <span className="muted small">✓ Already checked off from an earlier import</span>
                      ) : (
                      <select
                        value={r.benefitId ?? ''}
                        onChange={(e) =>
                          setRows(rows.map((x, j) => (j === i ? { ...x, benefitId: e.target.value || null } : x)))
                        }
                      >
                        <option value="">Skip</option>
                        {card.benefits
                          .filter((b) => !card.hiddenBenefitIds.includes(b.id))
                          .map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                      </select>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button className="btn" disabled={chosen.length === 0 && !(feeChanges && useFeeMonth)} onClick={confirm}>
              {chosen.length ? `Check off ${chosen.length} credit${chosen.length === 1 ? '' : 's'}` : feeChanges && useFeeMonth ? 'Update anniversary' : 'Nothing to add'}
            </button>
          </>
        )}

        <details className="small">
          <summary>How to download the CSV</summary>
          <ul className="howto-list">
            {HOW_TO.map(([bank, steps]) => (
              <li key={bank}>
                <strong>{bank}:</strong> {steps}
              </li>
            ))}
          </ul>
          <p className="muted">
            Credits that load inside another app (Uber Cash, Lyft, DoorDash promos) don't appear on statements. Check those
            off by hand.
          </p>
        </details>
      </div>
    </div>
  );
}
