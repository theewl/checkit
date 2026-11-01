import type { Benefit, CatalogCard } from '../types';

/**
 * Preloaded credits for popular cards, researched November 2026 from issuer pages
 * and 2025-2026 coverage (The Points Guy, NerdWallet, Doctor of Credit, One Mile at
 * a Time, Upgraded Points). Issuers change these often: every credit can be edited,
 * hidden, or added to in the app.
 *
 * Saved cards refresh from this list each time the app opens (see syncWithCatalog),
 * so keep benefit ids stable when amounts change.
 *
 * Certificates and points (free nights, companion fares, anniversary miles) are
 * marked `estimated` with a conservative cash value.
 */

const GLOBAL_ENTRY: Benefit = {
  id: 'global-entry',
  name: 'Global Entry / TSA PreCheck credit',
  amount: 120,
  frequency: 'annual',
  everyYears: 4,
  category: 'travel',
  howTo: 'Pay the Global Entry ($120) or TSA PreCheck application fee with the card.',
};

const CLEAR: Benefit = {
  id: 'clear',
  name: 'CLEAR+ credit',
  amount: 219,
  frequency: 'annual',
  category: 'travel',
  howTo: 'Pay for a CLEAR+ membership with the card.',
};

export const CATALOG: CatalogCard[] = [
  /* ---------------- American Express ---------------- */
  {
    id: 'amex-platinum',
    name: 'Platinum Card',
    issuer: 'American Express',
    annualFee: 895,
    color: '#8a8d91',
    benefits: [
      { id: 'uber', name: 'Uber Cash', amount: 15, frequency: 'monthly', monthOverrides: { 12: 35 }, category: 'rideshare', howTo: 'Add the card to Uber; loads monthly ($35 in December) for U.S. rides or Uber Eats. Expires at month end.' },
      { id: 'resy', name: 'Resy dining credit', amount: 100, frequency: 'quarterly', category: 'dining', howTo: 'Enroll, then pay with the card at Resy-listed U.S. restaurants.' },
      { id: 'digital-ent', name: 'Digital entertainment credit', amount: 25, frequency: 'monthly', category: 'entertainment', howTo: 'Enroll; Disney+, Hulu, ESPN+, Peacock, Paramount+, NYT, WSJ, YouTube Premium/TV.' },
      { id: 'lululemon', name: 'lululemon credit', amount: 75, frequency: 'quarterly', category: 'shopping', howTo: 'Enroll, then shop at U.S. lululemon stores or online.' },
      { id: 'hotel', name: 'Fine Hotels + Resorts / Hotel Collection credit', amount: 300, frequency: 'semiannual', category: 'hotel', howTo: 'Prepaid FHR (or 2+ night Hotel Collection) booking through Amex Travel.' },
      { id: 'airline', name: 'Airline incidental fee credit', amount: 200, frequency: 'annual', category: 'airline', howTo: 'Pick one airline in your Amex account; covers bags, seats, etc. (not tickets).' },
      { id: 'walmart', name: 'Walmart+ membership credit', amount: 12.95, frequency: 'monthly', category: 'shopping', howTo: 'Pay a monthly (not annual) Walmart+ membership with the card.' },
      { id: 'uber-one', name: 'Uber One membership credit', amount: 120, frequency: 'annual', category: 'rideshare', howTo: 'Pay an auto-renewing Uber One membership with the card.' },
      { id: 'equinox', name: 'Equinox credit', amount: 300, frequency: 'annual', category: 'fitness', howTo: 'Enroll; Equinox club or Equinox+ membership.' },
      { id: 'oura', name: 'Oura Ring credit', amount: 200, frequency: 'annual', category: 'fitness', howTo: 'Buy an Oura Ring at ouraring.com (memberships do not count).' },
      CLEAR,
      GLOBAL_ENTRY,
    ],
  },
  {
    id: 'amex-gold',
    name: 'Gold Card',
    issuer: 'American Express',
    annualFee: 325,
    color: '#c9a646',
    benefits: [
      { id: 'uber', name: 'Uber Cash', amount: 10, frequency: 'monthly', category: 'rideshare', howTo: 'Add the card to Uber; U.S. rides or Uber Eats. Expires at month end.' },
      { id: 'dining', name: 'Dining credit', amount: 10, frequency: 'monthly', category: 'dining', howTo: "Enroll; Grubhub, The Cheesecake Factory, Five Guys, Buffalo Wild Wings, Wonder." },
      { id: 'resy', name: 'Resy credit', amount: 50, frequency: 'semiannual', category: 'dining', howTo: 'Enroll; dine at Resy-listed U.S. restaurants.' },
      { id: 'dunkin', name: "Dunkin' credit", amount: 7, frequency: 'monthly', category: 'dining', howTo: "Enroll; pay at U.S. Dunkin' locations." },
    ],
  },
  {
    id: 'amex-business-platinum',
    name: 'Business Platinum Card',
    issuer: 'American Express',
    annualFee: 895,
    color: '#6f7378',
    benefits: [
      { id: 'hotel', name: 'Fine Hotels + Resorts / Hotel Collection credit', amount: 300, frequency: 'semiannual', category: 'hotel', howTo: 'Prepaid FHR or Hotel Collection booking through Amex Travel.' },
      { id: 'dell', name: 'Dell credit', amount: 150, frequency: 'annual', category: 'shopping', howTo: 'Enroll; U.S. purchases direct from Dell. An extra $1,000 unlocks after $5k Dell spend.' },
      { id: 'adobe', name: 'Adobe credit', amount: 250, frequency: 'annual', category: 'shopping', howTo: 'Enroll; earned after spending $600+ direct with Adobe in the year.' },
      { id: 'indeed', name: 'Indeed credit', amount: 90, frequency: 'quarterly', category: 'other', howTo: 'Enroll; Indeed hiring purchases.' },
      { id: 'wireless', name: 'Wireless credit', amount: 10, frequency: 'monthly', category: 'other', howTo: 'Enroll; pay a U.S. wireless carrier bill directly.' },
      { id: 'hilton', name: 'Hilton credit', amount: 50, frequency: 'quarterly', category: 'hotel', howTo: 'Enroll; eligible purchases at Hilton properties.' },
      { id: 'chatgpt', name: 'ChatGPT Business credit', amount: 300, frequency: 'annual', category: 'other', howTo: 'Enroll; pay for ChatGPT Business with the card.' },
      { id: 'airline', name: 'Airline incidental fee credit', amount: 200, frequency: 'annual', category: 'airline', howTo: 'Pick one airline in your Amex account; bags, seats, etc.' },
      CLEAR,
      GLOBAL_ENTRY,
    ],
  },
  {
    id: 'amex-green',
    name: 'Classic Green Card',
    issuer: 'American Express',
    annualFee: 150,
    color: '#5c8a5a',
    benefits: [CLEAR],
  },
  {
    id: 'amex-blue-cash-preferred',
    name: 'Blue Cash Preferred',
    issuer: 'American Express',
    annualFee: 95,
    color: '#3a6fb0',
    benefits: [
      { id: 'disney', name: 'Disney streaming credit', amount: 10, frequency: 'monthly', category: 'entertainment', howTo: 'Enroll; Disney+, Hulu or ESPN+ (bundles count).' },
    ],
  },
  {
    id: 'amex-blue-cash-everyday',
    name: 'Blue Cash Everyday',
    issuer: 'American Express',
    annualFee: 0,
    color: '#5b8fd6',
    benefits: [
      { id: 'disney', name: 'Disney streaming credit', amount: 7, frequency: 'monthly', category: 'entertainment', howTo: 'Enroll; Disney+, Hulu or ESPN+ (bundles count).' },
      { id: 'home-chef', name: 'Home Chef credit', amount: 15, frequency: 'monthly', category: 'dining', howTo: 'Enroll; auto-renewing Home Chef subscription via homechef.com/blue-cash-everyday.' },
    ],
  },
  {
    id: 'amex-hilton-aspire',
    name: 'Hilton Honors Aspire',
    issuer: 'American Express',
    annualFee: 550,
    color: '#1f3a5f',
    benefits: [
      { id: 'resort', name: 'Hilton resort credit', amount: 200, frequency: 'semiannual', category: 'hotel', howTo: 'Eligible charges at participating Hilton Resorts.' },
      { id: 'flight', name: 'Flight credit', amount: 50, frequency: 'quarterly', category: 'airline', howTo: 'Flights booked directly with an airline or via AmexTravel.com.' },
      { id: 'free-night', name: 'Free Night Reward', amount: 400, frequency: 'annual', resetBasis: 'anniversary', estimated: true, category: 'hotel', howTo: 'Arrives after card renewal; book any standard room at most Hilton hotels.' },
      CLEAR,
    ],
  },
  {
    id: 'amex-hilton-surpass',
    name: 'Hilton Honors Surpass',
    issuer: 'American Express',
    annualFee: 150,
    color: '#2d5a8a',
    benefits: [
      { id: 'hilton', name: 'Hilton credit', amount: 50, frequency: 'quarterly', category: 'hotel', howTo: 'Purchases made directly with Hilton.' },
    ],
  },
  {
    id: 'amex-hilton-business',
    name: 'Hilton Honors Business',
    issuer: 'American Express',
    annualFee: 195,
    color: '#24486e',
    benefits: [
      { id: 'hilton', name: 'Hilton credit', amount: 60, frequency: 'quarterly', category: 'hotel', howTo: 'Purchases made directly with Hilton.' },
    ],
  },
  {
    id: 'amex-marriott-brilliant',
    name: 'Marriott Bonvoy Brilliant',
    issuer: 'American Express',
    annualFee: 650,
    color: '#3b3b3b',
    benefits: [
      { id: 'dining', name: 'Dining credit', amount: 25, frequency: 'monthly', category: 'dining', howTo: 'Any eligible restaurant purchase worldwide.' },
      { id: 'free-night', name: 'Free Night Award (up to 85k points)', amount: 500, frequency: 'annual', resetBasis: 'anniversary', estimated: true, category: 'hotel', howTo: 'Arrives each anniversary; valid one year. Top up with up to 15k of your own points.' },
      GLOBAL_ENTRY,
    ],
  },
  {
    id: 'amex-delta-reserve',
    name: 'Delta SkyMiles Reserve',
    issuer: 'American Express',
    annualFee: 650,
    color: '#4a4f6a',
    benefits: [
      { id: 'resy', name: 'Resy credit', amount: 20, frequency: 'monthly', category: 'dining', howTo: 'Enroll; U.S. Resy restaurants.' },
      { id: 'rideshare', name: 'Rideshare credit', amount: 10, frequency: 'monthly', category: 'rideshare', howTo: 'Enroll; U.S. rideshare purchases (Uber, Lyft, etc.).' },
      { id: 'stays', name: 'Delta Stays credit', amount: 200, frequency: 'annual', category: 'hotel', howTo: 'Prepaid hotel or rental booked on Delta Stays (delta.com).' },
      { id: 'companion', name: 'Companion Certificate', amount: 500, frequency: 'annual', resetBasis: 'anniversary', estimated: true, category: 'airline', howTo: 'Round trip in First, Comfort or Main within the U.S., Mexico, Caribbean, Central America.' },
      GLOBAL_ENTRY,
    ],
  },
  {
    id: 'amex-delta-platinum',
    name: 'Delta SkyMiles Platinum',
    issuer: 'American Express',
    annualFee: 350,
    color: '#5d6378',
    benefits: [
      { id: 'resy', name: 'Resy credit', amount: 10, frequency: 'monthly', category: 'dining', howTo: 'Enroll; U.S. Resy restaurants.' },
      { id: 'rideshare', name: 'Rideshare credit', amount: 10, frequency: 'monthly', category: 'rideshare', howTo: 'Enroll; U.S. rideshare purchases.' },
      { id: 'stays', name: 'Delta Stays credit', amount: 150, frequency: 'annual', category: 'hotel', howTo: 'Prepaid hotel booked on Delta Stays (delta.com).' },
      { id: 'companion', name: 'Main Cabin Companion Certificate', amount: 300, frequency: 'annual', resetBasis: 'anniversary', estimated: true, category: 'airline', howTo: 'Main Cabin round trip within the U.S., Mexico, Caribbean, Central America.' },
      GLOBAL_ENTRY,
    ],
  },

  /* ---------------- Chase ---------------- */
  {
    id: 'chase-sapphire-reserve',
    name: 'Sapphire Reserve',
    issuer: 'Chase',
    annualFee: 795,
    color: '#1b2a4a',
    benefits: [
      { id: 'travel', name: 'Annual travel credit', amount: 300, frequency: 'annual', resetBasis: 'anniversary', category: 'travel', howTo: 'Applies automatically to any travel purchase.' },
      { id: 'edit', name: 'The Edit hotel credit', amount: 500, frequency: 'annual', category: 'hotel', howTo: 'Two credits of up to $250 per prepaid 2+ night stay from The Edit via Chase Travel.' },
      { id: 'hotel-2026', name: '2026 select-hotel credit', amount: 250, frequency: 'annual', endsAfter: '2026-12-31', category: 'hotel', howTo: 'One-time for 2026: prepaid 2+ nights via Chase Travel at IHG, Montage, Pendry, Omni, Virgin, Minor or Pan Pacific.' },
      { id: 'dining', name: 'Exclusive Tables dining credit', amount: 150, frequency: 'semiannual', category: 'dining', howTo: 'Sapphire Reserve Exclusive Tables restaurants on OpenTable.' },
      { id: 'stubhub', name: 'StubHub / viagogo credit', amount: 150, frequency: 'semiannual', category: 'entertainment', howTo: 'Activate, then buy tickets on StubHub or viagogo.' },
      { id: 'doordash', name: 'DoorDash promos', amount: 35, frequency: 'monthly', category: 'dining', howTo: '$15 on any order + two $10 grocery/retail promos, with DashPass.' },
      { id: 'lyft', name: 'Lyft credit', amount: 10, frequency: 'monthly', category: 'rideshare', howTo: 'Add the card to Lyft; in-app credit each month.' },
      { id: 'peloton', name: 'Peloton credit', amount: 10, frequency: 'monthly', category: 'fitness', howTo: 'Activate; eligible Peloton memberships.' },
      GLOBAL_ENTRY,
    ],
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Sapphire Preferred',
    issuer: 'Chase',
    annualFee: 95,
    color: '#2c4f8c',
    benefits: [
      { id: 'hotel', name: 'Chase Travel hotel credit', amount: 100, frequency: 'annual', resetBasis: 'anniversary', category: 'hotel', howTo: 'Hotel booked through Chase Travel.' },
      GLOBAL_ENTRY,
    ],
  },
  {
    id: 'chase-sapphire-reserve-business',
    name: 'Sapphire Reserve for Business',
    issuer: 'Chase',
    annualFee: 795,
    color: '#162238',
    benefits: [
      { id: 'travel', name: 'Annual travel credit', amount: 300, frequency: 'annual', resetBasis: 'anniversary', category: 'travel', howTo: 'Applies automatically to travel purchases.' },
      { id: 'edit', name: 'The Edit hotel credit', amount: 500, frequency: 'annual', category: 'hotel', howTo: 'Up to $250 per prepaid 2+ night stay from The Edit via Chase Travel.' },
      { id: 'hotel-2026', name: '2026 select-hotel credit', amount: 250, frequency: 'annual', endsAfter: '2026-12-31', category: 'hotel', howTo: 'One-time for 2026: prepaid 2+ nights via Chase Travel at select brands (IHG, Montage, Omni…).' },
      { id: 'ziprecruiter', name: 'ZipRecruiter credit', amount: 200, frequency: 'semiannual', category: 'other', howTo: 'Activate; ZipRecruiter purchases.' },
      { id: 'google', name: 'Google Workspace credit', amount: 200, frequency: 'annual', category: 'other', howTo: 'Purchases made directly with Google Workspace.' },
      { id: 'lyft', name: 'Lyft credit', amount: 10, frequency: 'monthly', category: 'rideshare', howTo: 'Add the card to Lyft.' },
      { id: 'doordash', name: 'DoorDash promos', amount: 25, frequency: 'monthly', category: 'dining', howTo: 'Monthly DoorDash promos with DashPass (check exact split in the app).' },
      GLOBAL_ENTRY,
    ],
  },
  {
    id: 'chase-united-explorer',
    name: 'United Explorer',
    issuer: 'Chase',
    annualFee: 150,
    color: '#1a4f9c',
    benefits: [
      { id: 'instacart', name: 'Instacart credit', amount: 10, frequency: 'monthly', category: 'shopping', howTo: 'Pay for Instacart orders with the card.' },
      { id: 'rideshare', name: 'Rideshare credit', amount: 5, frequency: 'monthly', category: 'rideshare', howTo: 'Opt in each year; rideshare purchases.' },
      { id: 'jsx', name: 'JSX credit', amount: 100, frequency: 'annual', resetBasis: 'anniversary', category: 'airline', howTo: 'Flights booked directly with JSX.' },
      { id: 'hotels', name: 'United Hotels credit', amount: 100, frequency: 'annual', resetBasis: 'anniversary', category: 'hotel', howTo: '$50 off each of your first two prepaid stays via United Hotels.' },
      { id: 'avis', name: 'Avis / Budget TravelBank cash', amount: 50, frequency: 'annual', resetBasis: 'anniversary', category: 'travel', howTo: '$25 for each of your first two rentals via United car rentals.' },
      GLOBAL_ENTRY,
    ],
  },
  {
    id: 'chase-united-quest',
    name: 'United Quest',
    issuer: 'Chase',
    annualFee: 350,
    color: '#123d7a',
    benefits: [
      { id: 'united', name: 'United travel credit', amount: 200, frequency: 'annual', resetBasis: 'anniversary', category: 'airline', howTo: 'United purchases (lands as TravelBank cash).' },
      { id: 'instacart', name: 'Instacart credit', amount: 15, frequency: 'monthly', category: 'shopping', howTo: 'Pay for Instacart orders with the card.' },
      { id: 'rideshare', name: 'Rideshare credit', amount: 8, frequency: 'monthly', monthOverrides: { 12: 12 }, category: 'rideshare', howTo: 'Enroll; rideshare purchases ($12 in December).' },
      { id: 'jsx', name: 'JSX credit', amount: 150, frequency: 'annual', resetBasis: 'anniversary', category: 'airline', howTo: 'Flights booked directly with JSX.' },
      { id: 'hotels', name: 'Renowned Hotels credit', amount: 150, frequency: 'annual', resetBasis: 'anniversary', category: 'hotel', howTo: 'Prepaid Renowned Hotels and Resorts stays via United.' },
      { id: 'avis', name: 'Avis / Budget TravelBank cash', amount: 80, frequency: 'annual', resetBasis: 'anniversary', category: 'travel', howTo: '$40 for each of your first two rentals via United car rentals.' },
      GLOBAL_ENTRY,
    ],
  },
  {
    id: 'chase-united-club',
    name: 'United Club Card',
    issuer: 'Chase',
    annualFee: 695,
    color: '#0c2d5c',
    benefits: [
      { id: 'instacart', name: 'Instacart credit', amount: 20, frequency: 'monthly', category: 'shopping', howTo: 'Two $10 credits a month on Instacart.' },
      { id: 'rideshare', name: 'Rideshare credit', amount: 12, frequency: 'monthly', monthOverrides: { 12: 18 }, category: 'rideshare', howTo: 'Opt in each year; rideshare purchases ($18 in December).' },
      { id: 'jsx', name: 'JSX credit', amount: 200, frequency: 'annual', resetBasis: 'anniversary', category: 'airline', howTo: 'Flights booked directly with JSX.' },
      { id: 'hotels', name: 'Renowned Hotels credit', amount: 200, frequency: 'annual', resetBasis: 'anniversary', category: 'hotel', howTo: 'Prepaid Renowned Hotels and Resorts stays via United.' },
      { id: 'avis', name: 'Avis / Budget TravelBank cash', amount: 100, frequency: 'annual', resetBasis: 'anniversary', category: 'travel', howTo: '$50 for each of your first two rentals via United car rentals.' },
      GLOBAL_ENTRY,
    ],
  },
  {
    id: 'chase-southwest-priority',
    name: 'Southwest Rapid Rewards Priority',
    issuer: 'Chase',
    annualFee: 229,
    color: '#304cb2',
    benefits: [
      { id: 'points', name: '7,500 anniversary points', amount: 97, frequency: 'annual', resetBasis: 'anniversary', estimated: true, category: 'airline', howTo: 'Deposited automatically each account anniversary.' },
    ],
  },
  {
    id: 'chase-marriott-boundless',
    name: 'Marriott Bonvoy Boundless',
    issuer: 'Chase',
    annualFee: 95,
    color: '#4b4038',
    benefits: [
      { id: 'free-night', name: 'Free Night Award (up to 35k points)', amount: 245, frequency: 'annual', resetBasis: 'anniversary', estimated: true, category: 'hotel', howTo: 'Arrives each anniversary; valid one year.' },
      { id: 'airline', name: 'Airline credit (limited time)', amount: 50, frequency: 'semiannual', category: 'airline', howTo: 'Activate; $50 back after $250+ bought directly from an airline. Limited-time offer.' },
    ],
  },
  {
    id: 'chase-ihg-premier',
    name: 'IHG One Rewards Premier',
    issuer: 'Chase',
    annualFee: 150,
    color: '#2f5d3a',
    benefits: [
      { id: 'food', name: 'Food & beverage credit', amount: 25, frequency: 'quarterly', category: 'dining', howTo: 'Dining charged to your IHG room folio.' },
      { id: 'airline', name: 'Airline credit', amount: 100, frequency: 'annual', category: 'airline', howTo: 'Airline purchases with the card (check terms in your Chase account).' },
      { id: 'free-night', name: 'Anniversary Free Night', amount: 250, frequency: 'annual', resetBasis: 'anniversary', estimated: true, category: 'hotel', howTo: 'Arrives each anniversary; top up with your own points.' },
      GLOBAL_ENTRY,
    ],
  },
  {
    id: 'chase-world-of-hyatt',
    name: 'World of Hyatt',
    issuer: 'Chase',
    annualFee: 95,
    color: '#6b4a2e',
    benefits: [
      { id: 'free-night', name: 'Category 1-4 Free Night', amount: 200, frequency: 'annual', resetBasis: 'anniversary', estimated: true, category: 'hotel', howTo: 'Arrives each anniversary; book a Category 1-4 Hyatt.' },
    ],
  },

  /* ---------------- Capital One ---------------- */
  {
    id: 'capone-venture-x',
    name: 'Venture X',
    issuer: 'Capital One',
    annualFee: 395,
    color: '#0e3b4f',
    benefits: [
      { id: 'travel', name: 'Capital One Travel credit', amount: 300, frequency: 'annual', resetBasis: 'anniversary', category: 'travel', howTo: 'Bookings made through Capital One Travel.' },
      { id: 'miles', name: '10,000 anniversary miles', amount: 100, frequency: 'annual', resetBasis: 'anniversary', estimated: true, category: 'travel', howTo: 'Deposited automatically each anniversary.' },
      GLOBAL_ENTRY,
    ],
  },
  {
    id: 'capone-venture-x-business',
    name: 'Venture X Business',
    issuer: 'Capital One',
    annualFee: 395,
    color: '#0a2c3b',
    benefits: [
      { id: 'travel', name: 'Capital One Business Travel credit', amount: 300, frequency: 'annual', resetBasis: 'anniversary', category: 'travel', howTo: 'Bookings made through Capital One Business Travel.' },
      { id: 'miles', name: '10,000 anniversary miles', amount: 100, frequency: 'annual', resetBasis: 'anniversary', estimated: true, category: 'travel', howTo: 'Deposited automatically each anniversary.' },
      GLOBAL_ENTRY,
    ],
  },

  /* ---------------- Citi ---------------- */
  {
    id: 'citi-strata-elite',
    name: 'Strata Elite',
    issuer: 'Citi',
    annualFee: 595,
    color: '#25384d',
    benefits: [
      { id: 'hotel', name: 'Hotel credit', amount: 300, frequency: 'annual', category: 'hotel', howTo: '2+ night hotel stay booked via Citi Travel.' },
      { id: 'splurge', name: 'Splurge credit', amount: 200, frequency: 'annual', category: 'shopping', howTo: 'Pick up to two: American Airlines, Best Buy, 1stDibs, Future, Live Nation.' },
      { id: 'blacklane', name: 'Blacklane credit', amount: 100, frequency: 'semiannual', category: 'rideshare', howTo: 'Blacklane chauffeur rides.' },
      GLOBAL_ENTRY,
    ],
  },
  {
    id: 'citi-strata-premier',
    name: 'Strata Premier',
    issuer: 'Citi',
    annualFee: 95,
    color: '#34506b',
    benefits: [
      { id: 'hotel', name: 'Hotel savings', amount: 100, frequency: 'annual', category: 'hotel', howTo: '$100 off one $500+ hotel stay (before taxes) booked via Citi Travel.' },
    ],
  },
  {
    id: 'citi-aadvantage-executive',
    name: 'AAdvantage Executive World Legend',
    issuer: 'Citi',
    annualFee: 695,
    color: '#36495e',
    benefits: [
      { id: 'lyft', name: 'Lyft credit', amount: 15, frequency: 'monthly', category: 'rideshare', howTo: 'Unlocks after 3 Lyft rides in the calendar month.' },
      { id: 'inkind', name: 'inKind dining credit', amount: 100, frequency: 'semiannual', category: 'dining', howTo: 'Add the card in the inKind app; credit applies at checkout.' },
      { id: 'avis', name: 'Avis / Budget credit', amount: 120, frequency: 'annual', category: 'travel', howTo: 'Prepaid Avis or Budget rentals.' },
      { id: 'inflight', name: 'Inflight & Admirals Club purchase credit', amount: 100, frequency: 'annual', category: 'airline', howTo: 'Inflight purchases and Admirals Club purchases.' },
      { id: 'aa-vacations', name: 'AA Vacations credit', amount: 500, frequency: 'annual', category: 'travel', howTo: 'Packages booked through American Airlines Vacations.' },
      GLOBAL_ENTRY,
    ],
  },

  /* ---------------- Others ---------------- */
  {
    id: 'bilt-palladium',
    name: 'Bilt Palladium',
    issuer: 'Bilt',
    annualFee: 495,
    color: '#5a5a5a',
    benefits: [
      { id: 'hotel', name: 'Bilt Travel hotel credit', amount: 200, frequency: 'semiannual', category: 'hotel', howTo: '2+ night stay booked through Bilt Travel.' },
      { id: 'bilt-cash', name: 'Bilt Cash', amount: 200, frequency: 'annual', category: 'other', howTo: 'Use Bilt Cash in the Bilt app before it expires.' },
    ],
  },
  {
    id: 'bilt-obsidian',
    name: 'Bilt Obsidian',
    issuer: 'Bilt',
    annualFee: 95,
    color: '#2a2a2a',
    benefits: [
      { id: 'hotel', name: 'Bilt Travel hotel credit', amount: 50, frequency: 'semiannual', category: 'hotel', howTo: '2+ night stay booked through Bilt Travel.' },
    ],
  },
  {
    id: 'usbank-altitude-connect',
    name: 'Altitude Connect',
    issuer: 'U.S. Bank',
    annualFee: 0,
    color: '#0c2074',
    benefits: [{ ...GLOBAL_ENTRY, amount: 100 }],
  },
];

export function findCatalogCard(id: string | null): CatalogCard | undefined {
  return CATALOG.find((c) => c.id === id);
}
