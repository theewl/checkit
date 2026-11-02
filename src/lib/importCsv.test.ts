import { describe, expect, it } from 'vitest';
import { fileHash, findAnnualFee, parseCsv, readTransactions, suggestMatches } from './importCsv';
import { cardFromCatalog } from './store';

const AMEX = `Date,Description,Card Member,Account #,Amount
11/02/2026,"UBER EATS, SAN FRANCISCO",JANE DOE,-11005,24.10
11/03/2026,Platinum Digital Entertainment Credit,JANE DOE,-11005,-25.00
11/05/2026,AMEX Resy Credit,JANE DOE,-11005,-100.00
11/06/2026,LULULEMON ATHLETICA,JANE DOE,-11005,-58.00
11/07/2026,AUTOPAY PAYMENT - THANK YOU,JANE DOE,-11005,-900.00
11/08/2026,NETFLIX.COM,JANE DOE,-11005,15.49
11/09/2026,WHOLE FOODS,JANE DOE,-11005,80.12`;

const CHASE = `Transaction Date,Post Date,Description,Category,Type,Amount,Memo
11/01/2026,11/02/2026,STARBUCKS,Food & Drink,Sale,-6.25,
11/02/2026,11/03/2026,THE EDIT HOTEL CREDIT,,Adjustment,250.00,
11/04/2026,11/05/2026,PELOTON MEMBERSHIP,Health,Sale,-44.00,
11/05/2026,11/06/2026,PELOTON CREDIT,,Adjustment,10.00,
11/06/2026,11/07/2026,SHELL OIL,Gas,Sale,-40.00,`;

const CAPONE = `Transaction Date,Posted Date,Card No.,Description,Category,Debit,Credit
2026-11-01,2026-11-02,1234,DELTA AIR LINES,Airfare,420.00,
2026-11-03,2026-11-04,1234,CAPITAL ONE TRAVEL CREDIT,Other,,300.00`;

describe('parseCsv', () => {
  it('handles quoted commas and escaped quotes', () => {
    expect(parseCsv('a,"b, c","say ""hi"""\r\n1,2,3')).toEqual([
      ['a', 'b, c', 'say "hi"'],
      ['1', '2', '3'],
    ]);
  });
});

describe('readTransactions', () => {
  it('reads Amex (charges positive)', () => {
    const t = readTransactions(AMEX);
    expect(t).toHaveLength(7);
    expect(t.find((x) => x.description.includes('Resy'))!).toMatchObject({ amount: 100, isCredit: true });
    expect(t.find((x) => x.description.includes('NETFLIX'))!.isCredit).toBe(false);
  });

  it('reads Chase (charges negative)', () => {
    const t = readTransactions(CHASE);
    expect(t.find((x) => x.description.includes('EDIT'))!).toMatchObject({ amount: 250, isCredit: true });
    expect(t.find((x) => x.description === 'STARBUCKS')!.isCredit).toBe(false);
  });

  it('reads Capital One / Citi debit and credit columns', () => {
    const t = readTransactions(CAPONE);
    expect(t[1]).toMatchObject({ amount: 300, isCredit: true });
    expect(t[1].date).toEqual(new Date(2026, 10, 3));
  });

  it('rejects files without a date column', () => {
    expect(() => readTransactions('foo,bar\n1,2')).toThrow();
  });
});

describe('suggestMatches', () => {
  it('finds Amex statement credits and ignores refunds and payments', () => {
    const plat = cardFromCatalog('amex-platinum', 1)!;
    const s = suggestMatches(plat, readTransactions(AMEX));
    expect(s.map((x) => [x.txn.description, x.benefitId])).toEqual([
      ['Platinum Digital Entertainment Credit', 'digital-ent'],
      ['AMEX Resy Credit', 'resy'],
    ]);
  });

  it('prefers the most specific keyword', () => {
    const csr = cardFromCatalog('chase-sapphire-reserve', 1)!;
    const s = suggestMatches(csr, readTransactions(CHASE));
    expect(s.map((x) => x.benefitId)).toEqual(['edit', 'peloton']);
  });

  it('matches Capital One travel credit', () => {
    const vx = cardFromCatalog('capone-venture-x', 1)!;
    expect(suggestMatches(vx, readTransactions(CAPONE)).map((x) => x.benefitId)).toEqual(['travel']);
  });
});

describe('fileHash', () => {
  it('is stable and content-sensitive', () => {
    expect(fileHash(AMEX)).toBe(fileHash(AMEX));
    expect(fileHash(AMEX)).not.toBe(fileHash(CHASE));
  });
});

describe('findAnnualFee', () => {
  it('finds the latest annual fee charge and ignores reversals', () => {
    const csv = `Date,Description,Amount
03/04/2026,ANNUAL MEMBERSHIP FEE,895.00
03/04/2025,ANNUAL MEMBERSHIP FEE,695.00
03/10/2026,ANNUAL FEE REVERSAL,-50.00
03/12/2026,AUTOPAY PAYMENT - THANK YOU,-900.00
03/15/2026,TARGET,40.00`;
    expect(findAnnualFee(readTransactions(csv))!.date).toEqual(new Date(2026, 2, 4));
  });

  it('returns null when there is no fee', () => {
    const csv = `Date,Description,Amount
03/12/2026,AUTOPAY PAYMENT - THANK YOU,-900.00
03/15/2026,TARGET,40.00`;
    expect(findAnnualFee(readTransactions(csv))).toBeNull();
  });
});
