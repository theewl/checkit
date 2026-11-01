import type { CatalogCard } from '../types';

/**
 * Preloaded benefits for popular cards.
 *
 * Issuers change these often. Values reflect publicly announced terms as of
 * late 2026; every benefit can be edited, hidden, or added to in the app, so
 * check your card's benefits page and adjust anything that differs.
 */
export const CATALOG: CatalogCard[] = [
  {
    id: 'amex-platinum',
    name: 'Platinum Card',
    issuer: 'American Express',
    annualFee: 895,
    color: '#8a8d91',
    benefits: [
      { id: 'uber', name: 'Uber Cash', amount: 15, frequency: 'monthly', monthOverrides: { 12: 35 }, category: 'rideshare', howTo: 'Add the card to your Uber account; credit loads monthly as Uber Cash.' },
      { id: 'resy', name: 'Resy dining credit', amount: 100, frequency: 'quarterly', category: 'dining', howTo: 'Pay with the card at Resy-listed U.S. restaurants.' },
      { id: 'digital-ent', name: 'Digital entertainment credit', amount: 25, frequency: 'monthly', category: 'entertainment', howTo: 'Enroll, then pay for eligible streaming (Disney+, Hulu, Peacock, NYT, YouTube Premium…).' },
      { id: 'lululemon', name: 'lululemon credit', amount: 75, frequency: 'quarterly', category: 'shopping', howTo: 'Enroll, then shop at U.S. lululemon stores or online.' },
      { id: 'hotel', name: 'Fine Hotels + Resorts / Hotel Collection credit', amount: 300, frequency: 'semiannual', category: 'hotel', howTo: 'Prepaid FHR or Hotel Collection booking through Amex Travel.' },
      { id: 'airline', name: 'Airline incidental fee credit', amount: 200, frequency: 'annual', category: 'airline', howTo: 'Select one airline in your Amex account; covers bag fees, seat fees, etc.' },
      { id: 'walmart', name: 'Walmart+ membership credit', amount: 12.95, frequency: 'monthly', category: 'shopping', howTo: 'Pay for a monthly Walmart+ membership with the card.' },
      { id: 'clear', name: 'CLEAR+ credit', amount: 209, frequency: 'annual', category: 'travel' },
      { id: 'uber-one', name: 'Uber One membership credit', amount: 120, frequency: 'annual', category: 'rideshare' },
      { id: 'equinox', name: 'Equinox credit', amount: 300, frequency: 'annual', category: 'fitness' },
      { id: 'oura', name: 'Oura Ring credit', amount: 200, frequency: 'annual', category: 'fitness' },
    ],
  },
  {
    id: 'amex-gold',
    name: 'Gold Card',
    issuer: 'American Express',
    annualFee: 325,
    color: '#c9a646',
    benefits: [
      { id: 'uber', name: 'Uber Cash', amount: 10, frequency: 'monthly', category: 'rideshare', howTo: 'Add the card to Uber; usable on Uber Eats or rides in the U.S.' },
      { id: 'dining', name: 'Dining credit', amount: 10, frequency: 'monthly', category: 'dining', howTo: 'Enroll; Grubhub, The Cheesecake Factory, Goldbelly, Wine.com, Five Guys.' },
      { id: 'resy', name: 'Resy credit', amount: 50, frequency: 'semiannual', category: 'dining', howTo: 'Enroll; dine at Resy-listed U.S. restaurants.' },
      { id: 'dunkin', name: "Dunkin' credit", amount: 7, frequency: 'monthly', category: 'dining', howTo: "Enroll; pay at U.S. Dunkin' locations." },
    ],
  },
  {
    id: 'amex-green',
    name: 'Green Card',
    issuer: 'American Express',
    annualFee: 150,
    color: '#5c8a5a',
    benefits: [
      { id: 'clear', name: 'CLEAR+ credit', amount: 209, frequency: 'annual', category: 'travel' },
    ],
  },
  {
    id: 'amex-hilton-aspire',
    name: 'Hilton Honors Aspire',
    issuer: 'American Express',
    annualFee: 550,
    color: '#1f3a5f',
    benefits: [
      { id: 'resort', name: 'Hilton resort credit', amount: 200, frequency: 'semiannual', category: 'hotel', howTo: 'Charges at participating Hilton resorts.' },
      { id: 'flight', name: 'Flight credit', amount: 50, frequency: 'quarterly', category: 'airline', howTo: 'Flights booked directly with an airline or via Amex Travel.' },
      { id: 'clear', name: 'CLEAR+ credit', amount: 209, frequency: 'annual', category: 'travel' },
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
    ],
  },
  {
    id: 'amex-delta-reserve',
    name: 'Delta SkyMiles Reserve',
    issuer: 'American Express',
    annualFee: 650,
    color: '#4a4f6a',
    benefits: [
      { id: 'resy', name: 'Resy credit', amount: 20, frequency: 'monthly', category: 'dining' },
      { id: 'rideshare', name: 'Rideshare credit', amount: 10, frequency: 'monthly', category: 'rideshare', howTo: 'U.S. rideshare purchases (Uber, Lyft, etc.).' },
      { id: 'stays', name: 'Delta Stays credit', amount: 200, frequency: 'annual', category: 'hotel', howTo: 'Prepaid hotels booked through delta.com.' },
    ],
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Sapphire Reserve',
    issuer: 'Chase',
    annualFee: 795,
    color: '#1b2a4a',
    benefits: [
      { id: 'travel', name: 'Annual travel credit', amount: 300, frequency: 'annual', resetBasis: 'anniversary', category: 'travel', howTo: 'Applies automatically to any travel purchase.' },
      { id: 'edit', name: 'The Edit hotel credit', amount: 250, frequency: 'semiannual', category: 'hotel', howTo: 'Prepaid 2+ night stay from The Edit via Chase Travel.' },
      { id: 'dining', name: 'Exclusive Tables dining credit', amount: 150, frequency: 'semiannual', category: 'dining', howTo: 'Sapphire Reserve Exclusive Tables restaurants on OpenTable.' },
      { id: 'stubhub', name: 'StubHub / viagogo credit', amount: 150, frequency: 'semiannual', category: 'entertainment', howTo: 'Activate, then buy tickets on StubHub or viagogo.' },
      { id: 'doordash', name: 'DoorDash promos', amount: 25, frequency: 'monthly', category: 'dining', howTo: '$5 restaurant + two $10 grocery/retail promos with DashPass.' },
      { id: 'lyft', name: 'Lyft credit', amount: 10, frequency: 'monthly', category: 'rideshare', howTo: 'Add the card to Lyft; in-app credit each month.' },
      { id: 'peloton', name: 'Peloton credit', amount: 10, frequency: 'monthly', category: 'fitness' },
    ],
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Sapphire Preferred',
    issuer: 'Chase',
    annualFee: 95,
    color: '#2c4f8c',
    benefits: [
      { id: 'hotel', name: 'Chase Travel hotel credit', amount: 50, frequency: 'annual', resetBasis: 'anniversary', category: 'hotel', howTo: 'Hotel booked through Chase Travel.' },
      { id: 'doordash', name: 'DoorDash promo', amount: 10, frequency: 'monthly', category: 'dining', howTo: 'Non-restaurant DoorDash order with DashPass.' },
    ],
  },
  {
    id: 'capone-venture-x',
    name: 'Venture X',
    issuer: 'Capital One',
    annualFee: 395,
    color: '#0e3b4f',
    benefits: [
      { id: 'travel', name: 'Capital One Travel credit', amount: 300, frequency: 'annual', resetBasis: 'anniversary', category: 'travel', howTo: 'Bookings made through Capital One Travel.' },
    ],
  },
  {
    id: 'citi-strata-elite',
    name: 'Strata Elite',
    issuer: 'Citi',
    annualFee: 595,
    color: '#25384d',
    benefits: [
      { id: 'hotel', name: 'Hotel credit', amount: 300, frequency: 'annual', category: 'hotel', howTo: '2+ night hotel stay booked via cititravel.com.' },
      { id: 'splurge', name: 'Splurge credit', amount: 200, frequency: 'annual', category: 'shopping', howTo: 'Up to two chosen brands (e.g. American Airlines, Best Buy, Live Nation).' },
      { id: 'blacklane', name: 'Blacklane credit', amount: 100, frequency: 'semiannual', category: 'rideshare' },
    ],
  },
];

export function findCatalogCard(id: string | null): CatalogCard | undefined {
  return CATALOG.find((c) => c.id === id);
}
