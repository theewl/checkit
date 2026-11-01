import { useEffect, useMemo, useState } from 'react';
import { AddCard } from './components/AddCard';
import { BenefitRow } from './components/BenefitRow';
import { CardDetail } from './components/CardDetail';
import { Settings } from './components/Settings';
import { expiringSoon, sendDueNotifications } from './lib/reminders';
import { allStatuses, cardFromCatalog, money, round2, uid, useAppState, type BenefitStatus } from './lib/store';
import type { UserCard } from './types';

type Tab = 'overview' | 'cards' | 'settings';

export default function App() {
  const [state, update] = useAppState();
  const [tab, setTab] = useState<Tab>('overview');
  const [adding, setAdding] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [today, setToday] = useState(() => new Date());

  // Roll over to new periods if the app stays open past midnight.
  useEffect(() => {
    const t = setInterval(() => setToday(new Date()), 60 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const statuses = useMemo(() => allStatuses(state, today), [state, today]);
  const soon = useMemo(() => expiringSoon(statuses, state.settings.remindDaysBefore), [statuses, state.settings.remindDaysBefore]);
  const open = statuses.filter((s) => s.remaining > 0 && !soon.includes(s)).sort((a, b) => a.daysLeft - b.daysLeft);
  const done = statuses.filter((s) => s.remaining <= 0);

  const year = today.getFullYear();
  const capturedByCard = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of state.usage) {
      if (new Date(u.date).getFullYear() !== year) continue;
      m.set(u.cardId, round2((m.get(u.cardId) ?? 0) + u.amount));
    }
    return m;
  }, [state.usage, year]);
  const capturedTotal = [...capturedByCard.values()].reduce((a, b) => a + b, 0);
  const availableNow = statuses.reduce((s, x) => s + x.remaining, 0);
  const soonTotal = soon.reduce((s, x) => s + x.remaining, 0);
  const fees = state.cards.reduce((s, c) => s + c.annualFee, 0);

  // Browser notifications for credits about to expire.
  useEffect(() => {
    const sent = sendDueNotifications(state, today);
    if (sent.length) update((s) => ({ ...s, notified: [...s.notified, ...sent].slice(-500) }));
  }, [state, today, update]);

  const log = (s: BenefitStatus, amount: number) =>
    update((st) => ({
      ...st,
      usage: [
        ...st.usage,
        { id: uid(), cardId: s.card.id, benefitId: s.benefit.id, periodKey: s.period.key, amount: round2(amount), date: new Date().toISOString() },
      ],
    }));
  const undo = (entryId: string) => update((st) => ({ ...st, usage: st.usage.filter((u) => u.id !== entryId) }));

  const saveCard = (card: UserCard) => update((st) => ({ ...st, cards: st.cards.map((c) => (c.id === card.id ? card : c)) }));
  const addCard = (card: UserCard) => {
    update((st) => ({ ...st, cards: [...st.cards, card] }));
    setAdding(false);
    setActiveCardId(card.id);
    setTab('cards');
  };

  const activeCard = state.cards.find((c) => c.id === activeCardId) ?? state.cards[0];

  const row = (s: BenefitStatus) => (
    <BenefitRow
      key={`${s.card.id}:${s.benefit.id}`}
      status={s}
      showCard
      remindDays={state.settings.remindDaysBefore}
      onLog={(amt) => log(s, amt)}
      onUndo={undo}
    />
  );

  return (
    <div className="app">
      <header className="top">
        <h1>
          <span className="logo">✓</span> checkit
        </h1>
        <button className="btn small" onClick={() => setAdding(true)}>
          + Add card
        </button>
      </header>

      <nav className="tabs">
        {(['overview', 'cards', 'settings'] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t === 'overview' ? 'Overview' : t === 'cards' ? 'My cards' : 'Reminders & data'}
            {t === 'overview' && soon.length > 0 && <span className="badge">{soon.length}</span>}
          </button>
        ))}
      </nav>

      <main>
        {state.cards.length === 0 && tab !== 'settings' ? (
          <div className="empty">
            <h2>Stop leaving credits on the table</h2>
            <p className="muted">
              Add your credit cards and checkit preloads their credits — Uber Cash, dining, hotel, airline and more — then
              shows what's left to use, how long you have, and reminds you before they expire.
            </p>
            <button className="btn" onClick={() => setAdding(true)}>
              Add your first card
            </button>
          </div>
        ) : tab === 'overview' ? (
          <>
            <div className="stats">
              <div className="stat urgent">
                <div className="small">Expiring in {state.settings.remindDaysBefore} days</div>
                <div className="big">{money(soonTotal)}</div>
              </div>
              <div className="stat">
                <div className="small">Available right now</div>
                <div className="big">{money(availableNow)}</div>
              </div>
              <div className="stat">
                <div className="small">Captured in {year}</div>
                <div className="big">{money(capturedTotal)}</div>
                {fees > 0 && <div className="small muted">vs {money(fees)} in fees</div>}
              </div>
            </div>

            {soon.length > 0 && (
              <>
                <h2 className="section">⏰ Use these soon</h2>
                <div className="list">{soon.map(row)}</div>
              </>
            )}

            <h2 className="section">Still available</h2>
            <div className="list">
              {open.map(row)}
              {open.length === 0 && soon.length === 0 && <p className="muted center">Everything is used for this period. Nice!</p>}
            </div>

            {done.length > 0 && (
              <>
                <button className="link section" onClick={() => setShowDone((v) => !v)}>
                  {showDone ? '▾' : '▸'} Used this period ({done.length})
                </button>
                {showDone && <div className="list">{done.map(row)}</div>}
              </>
            )}
          </>
        ) : tab === 'cards' ? (
          <>
            <div className="card-picker">
              {state.cards.map((c) => (
                <button
                  key={c.id}
                  className={`card-pill ${activeCard?.id === c.id ? 'active' : ''}`}
                  style={{ borderColor: c.color }}
                  onClick={() => setActiveCardId(c.id)}
                >
                  <span className="swatch" style={{ background: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>
            {activeCard && (
              <CardDetail
                key={activeCard.id}
                card={activeCard}
                statuses={statuses.filter((s) => s.card.id === activeCard.id)}
                capturedThisYear={capturedByCard.get(activeCard.id) ?? 0}
                remindDays={state.settings.remindDaysBefore}
                onChange={saveCard}
                onRemove={() => {
                  update((st) => ({
                    ...st,
                    cards: st.cards.filter((c) => c.id !== activeCard.id),
                    usage: st.usage.filter((u) => u.cardId !== activeCard.id),
                  }));
                  setActiveCardId(null);
                }}
                onLog={log}
                onUndo={undo}
              />
            )}
          </>
        ) : (
          <Settings state={state} update={update} />
        )}
      </main>

      <footer className="muted small center">
        Credit amounts change often — check your card's benefits page and edit anything that differs. Data stays on this
        device.
      </footer>

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
