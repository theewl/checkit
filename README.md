# checkit

Track the credits on your credit cards (Uber Cash, dining, hotel, airline, streaming…) so you never let one expire unused.

- **Add your cards** from a built-in catalog (Amex Platinum/Gold/Green, Hilton Aspire, Marriott Brilliant, Delta Reserve, Chase Sapphire Reserve/Preferred, Capital One Venture X, Citi Strata Elite) or create a custom card. Every credit is editable or hideable, so you can match your card's current terms.
- **See what's left**: each credit shows a progress bar, the amount remaining, and the days left in its period. Credits can reset monthly, quarterly, every 6 months, yearly, or on your card anniversary.
- **Log usage** with one tap ("Used it all") or log a partial amount.
- **Reminders**:
  - *Use these soon* on the overview lists credits that expire within your chosen window (3–14 days).
  - *Calendar reminders* download as an `.ics` file with recurring events before each reset. Add it to Apple or Google Calendar and the reminders work even when the app is closed.
  - *Browser notifications* fire when you open the app and something is about to expire.
- **Fee payback**: see how much each card has returned this year compared to its annual fee.

All data stays in your browser's local storage. Use **Export backup** and **Import backup** to move it between devices.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build    # static site in dist/
```

On your phone, open the deployed site and choose **Add to Home Screen** to use it like an app.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds and publishes the site on every push to `main`. One-time setup: in the repo go to **Settings → Pages → Source** and pick **GitHub Actions**. The app will then be at `https://<user>.github.io/checkit/`.

## Notes

- Card credit terms change often. The catalog lives in `src/data/cards.ts`.
- The app does not connect to bank accounts, so usage is logged by hand. Automatic detection would need a bank-data provider such as Plaid plus a backend to keep API keys secret.
