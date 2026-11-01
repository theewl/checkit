import { useRef, useState } from 'react';
import type { AppState } from '../types';
import {
  buildIcs,
  downloadFile,
  notificationsSupported,
  requestNotificationPermission,
} from '../lib/reminders';
import { DEFAULT_STATE } from '../lib/store';

interface Props {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
}

export function Settings({ state, update }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const { settings } = state;

  const toggleNotifications = async () => {
    if (settings.notificationsEnabled) {
      update((s) => ({ ...s, settings: { ...s.settings, notificationsEnabled: false } }));
      return;
    }
    const ok = await requestNotificationPermission();
    if (!ok) {
      setMsg('Notifications were blocked. Allow them in your browser settings, or use the calendar reminders below.');
      return;
    }
    update((s) => ({ ...s, settings: { ...s.settings, notificationsEnabled: true } }));
    setMsg('Notifications on. You will get one when a credit is about to expire while the app is open.');
  };

  return (
    <section className="stack settings">
      <h2>Reminders</h2>
      <label>
        Remind me when a credit expires within
        <select
          value={settings.remindDaysBefore}
          onChange={(e) =>
            update((s) => ({ ...s, settings: { ...s.settings, remindDaysBefore: Number(e.target.value) } }))
          }
        >
          {[3, 5, 7, 10, 14].map((d) => (
            <option key={d} value={d}>
              {d} days
            </option>
          ))}
        </select>
      </label>

      <div className="setting-block">
        <strong>Calendar reminders (recommended)</strong>
        <p className="muted small">
          Downloads a calendar file with recurring reminders for every card, timed {settings.remindDaysBefore} days before
          each credit resets. Open it on your phone to add it to Apple Calendar or Google Calendar; it keeps working even
          when this app is closed. Re-download it after you add cards.
        </p>
        <button
          className="btn"
          disabled={state.cards.length === 0}
          onClick={() => downloadFile('card-credit-reminders.ics', buildIcs(state, new Date()), 'text/calendar')}
        >
          Download calendar reminders
        </button>
      </div>

      <div className="setting-block">
        <strong>Browser notifications</strong>
        <p className="muted small">Pops up a notification for each expiring credit when you open the app.</p>
        <button className="btn ghost" onClick={toggleNotifications} disabled={!notificationsSupported()}>
          {!notificationsSupported()
            ? 'Not supported in this browser'
            : settings.notificationsEnabled
              ? 'Turn off notifications'
              : 'Turn on notifications'}
        </button>
      </div>
      {msg && <p className="notice small">{msg}</p>}

      <h2>Your data</h2>
      <p className="muted small">
        Everything is stored only on this device. Back it up to move to another phone or browser.
      </p>
      <div className="row">
        <button
          className="btn ghost"
          onClick={() => downloadFile('checkit-backup.json', JSON.stringify(state, null, 2), 'application/json')}
        >
          Export backup
        </button>
        <button className="btn ghost" onClick={() => fileRef.current?.click()}>
          Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              const parsed = JSON.parse(await f.text()) as AppState;
              if (!Array.isArray(parsed.cards) || !Array.isArray(parsed.usage)) throw new Error('bad file');
              update(() => ({ ...DEFAULT_STATE, ...parsed, settings: { ...DEFAULT_STATE.settings, ...parsed.settings } }));
              setMsg('Backup restored.');
            } catch {
              setMsg('That file is not a checkit backup.');
            }
            e.target.value = '';
          }}
        />
      </div>
      <button
        className="btn danger ghost"
        onClick={() => {
          if (confirm('Delete all cards and history from this device?')) update(() => DEFAULT_STATE);
        }}
      >
        Erase everything
      </button>
    </section>
  );
}
