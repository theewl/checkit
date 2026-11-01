import { useEffect, useMemo, useState } from 'react';
import { AddCard } from './components/AddCard';
import { CreditRow } from './components/CreditRow';
import { EditCard } from './components/EditCard';
import { Settings } from './components/Settings';
import { sendDueNotifications } from './lib/reminders';
import { allStatuses, cardFromCatalog, money, round2, uid, useAppState, type BenefitStatus } from './lib/store';
import type { UserCard } from './types';

export default function App() {
  const [state, update] = useAppState();
  const [adding, setAdding] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [today, setToday] = useState(() => new Date());

  // Credits reset on their own: re-check the date hourly and whenever the app comes back to the foreground.
  useEffect(() => {
    const tick = () => setToday(new Date());
    const t = setInterval(tick, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  useEffect(() => {
    const sent = sendDueNotifications(state, today);
    if (sent.length) update((s) => ({ ...s, notified: [...s.notified, ...sent].slice(-500) }));
  }, [state, today, update]);

  const remindDays = state.settings.remindDaysBefore;
  const all = useMemo(() => allStatuses(state, today), [state, today]);
  const shown = filter ? all.filter((s) => s.card.id === filter) : all;
  const todo = shown
    .filter((s) => s.remaining > 0)
    .sort((a, b) => a.daysLeft - b.daysLeft || b.remaining - a.remaining);
  const done = shown.filter((s) => s.remaining <= 0);

  const left = shown.reduce((s, x) => s + x.remaining, 0);
  const total = shown.reduce((s, x) => s + x.available, 0);
  const soon = todo.filter((s) => s.daysLeft <= remindDays);
  const soonAmount = soon.reduce((s, x) => s + x.remaining, 0);

  const log = (s: BenefitStatus, amount: number) =>
    update((st) => ({
      ...st,
      usage: [
        ...st.usage,
        { id: uid(), cardId: s.card.id, benefitId: s.benefit.id, periodKey: s.period.key, amount: round2(amount), date: new Date().toISOString() },
      ],
    }));
  const clear = (ids: string[]) => update((st) => ({ ...st, usage: st.usage.filter((u) => !ids.includes(u.id)) }));

  const addCard = (card: UserCard) => {
    update((st) => ({ ...st, cards: [...st.cards, card] }));
    setAdding(false);
    // A custom card starts empty, so open it for adding credits.
    if (card.benefits.length === 0) {
      setEditingId(card.id);
      setMenuOpen(true);
    }
  };

  const editing = state.cards.find((c) => c.id === editingId);

  return (
    <div className="app">
      <header className="top">
        <h1>
          <span className="logo">✓</span> checkit
        </h1>
        <div className="row">
          <button className="btn small" onClick={() => setAdding(true)}>
            + Card
          </button>
          {state.cards.length > 0 && (
            <button className="btn small ghost" onClick={() => setMenuOpen(true)} aria-label="Menu">
              ☰
            </button>
          )}
        </div>
      </header>

      {state.cards.length === 0 ? (
        <div className="empty">
          <h2>Never waste a card credit again</h2>
          <p className="muted">Add your cards. We'll list every credit, show what's left, and reset them automatically.</p>
          <button className="btn" onClick={() => setAdding(true)}>
            Add your first card
          </button>
        </div>
      ) : (
        <main>
          <section className="summary">
            <div className="summary-left">
              <span className="big">{money(left)}</span>
              <span className="muted"> left to use</span>
            </div>
            <div className="bar">
              <div style={{ width: `${total ? ((total - left) / total) * 100 : 0}%` }} />
            </div>
            <div className="muted small">
              {money(round2(total - left))} of {money(total)} used
              {soon.length > 0 && (
                <>
                  {' · '}
                  <span className="warn">
                    {money(soonAmount)} expires within {remindDays} days
                  </span>
                </>
              )}
            </div>
          </section>

          {state.cards.length > 1 && (
            <div className="filters">
              <button className={!filter ? 'active' : ''} onClick={() => setFilter(null)}>
                All cards
              </button>
              {state.cards.map((c) => (
                <button key={c.id} className={filter === c.id ? 'active' : ''} onClick={() => setFilter(c.id)}>
                  <span className="dot" style={{ background: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>
          )}

          <h2 className="section">To use</h2>
          {todo.length > 0 ? (
            <ul className="credits">
              {todo.map((s) => (
                <CreditRow key={`${s.card.id}:${s.benefit.id}`} status={s} remindDays={remindDays} onLog={(a) => log(s, a)} onClear={clear} />
              ))}
            </ul>
          ) : (
            <p className="muted center">All used. Nice! 🎉</p>
          )}

          {done.length > 0 && (
            <>
              <button className="link section" onClick={() => setShowDone((v) => !v)}>
                {showDone ? '▾' : '▸'} Used ({done.length})
              </button>
              {showDone && (
                <ul className="credits">
                  {done.map((s) => (
                    <CreditRow key={`${s.card.id}:${s.benefit.id}`} status={s} remindDays={remindDays} onLog={(a) => log(s, a)} onClear={clear} />
                  ))}
                </ul>
              )}
            </>
          )}
          <p className="muted small center hint">Tap ○ when you use a credit. Tap a credit for details.</p>
        </main>
      )}

      {menuOpen && (
        <div className="modal-backdrop" onClick={() => setMenuOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Menu">
            <div className="modal-head">
              <h2>{editing ? editing.name : 'Menu'}</h2>
              <button className="btn ghost small" onClick={() => (editing ? setEditingId(null) : setMenuOpen(false))} aria-label="Close">
                {editing ? '← Back' : '✕'}
              </button>
            </div>
            {editing ? (
              <EditCard
                key={editing.id}
                card={editing}
                onChange={(card) => update((st) => ({ ...st, cards: st.cards.map((c) => (c.id === card.id ? card : c)) }))}
                onDone={() => setEditingId(null)}
                onRemove={() => {
                  update((st) => ({
                    ...st,
                    cards: st.cards.filter((c) => c.id !== editing.id),
                    usage: st.usage.filter((u) => u.cardId !== editing.id),
                  }));
                  if (filter === editing.id) setFilter(null);
                  setEditingId(null);
                }}
              />
            ) : (
              <>
                <h3>Your cards</h3>
                <ul className="card-list">
                  {state.cards.map((c) => (
                    <li key={c.id}>
                      <button onClick={() => setEditingId(c.id)}>
                        <span className="dot" style={{ background: c.color }} />
                        <span className="grow">{c.name}</span>
                        <span className="muted small">Edit ›</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <Settings state={state} update={update} />
              </>
            )}
          </div>
        </div>
      )}

      {adding && (
        <AddCard
          ownedCatalogIds={state.cards.map((c) => c.catalogId ?? '')}
          onClose={() => setAdding(false)}
          onAdd={(id, month) => {
            const card = cardFromCatalog(id, month);
            if (card) addCard(card);
          }}
          onAddCustom={addCard}
        />
      )}
    </div>
  );
}
