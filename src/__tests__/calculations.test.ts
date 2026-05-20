import { calcTrade } from '@/lib/calculations';

describe('calcTrade — Long', () => {
  it('calculates profit correctly', () => {
    const r = calcTrade('Long', 100, 90, 110, 10, null);
    // (110 - 100) * 10 = 100
    expect(r.totalPl).toBeCloseTo(100, 2);
  });

  it('calculates loss correctly', () => {
    const r = calcTrade('Long', 100, 90, 95, 10, null);
    // (95 - 100) * 10 = -50
    expect(r.totalPl).toBeCloseTo(-50, 2);
  });

  it('calculates r_multiple correctly', () => {
    const r = calcTrade('Long', 100, 90, 110, 10, null);
    // totalPl=100, risk = |100-90|*10 = 100 → rMult = 100/100 = 1
    expect(r.rMultiple).toBeCloseTo(1, 4);
  });

  it('returns null rMultiple when no stop loss', () => {
    const r = calcTrade('Long', 100, null, 110, 10, null);
    expect(r.rMultiple).toBeNull();
  });

  it('subtracts commission from totalPl', () => {
    const r = calcTrade('Long', 100, 90, 110, 10, 5);
    expect(r.totalPl).toBeCloseTo(95, 2);
  });
});

describe('calcTrade — Short', () => {
  it('calculates profit correctly', () => {
    const r = calcTrade('Short', 100, 110, 90, 10, null);
    // (100 - 90) * 10 = 100
    expect(r.totalPl).toBeCloseTo(100, 2);
  });

  it('calculates loss correctly', () => {
    const r = calcTrade('Short', 100, 110, 105, 10, null);
    // (100 - 105) * 10 = -50
    expect(r.totalPl).toBeCloseTo(-50, 2);
  });
});

describe('calcTrade — amounts', () => {
  it('calculates amountInvested as entry * shares', () => {
    const r = calcTrade('Long', 6896.3, 6891, 6899.14, 1, null);
    expect(r.amountInvested).toBeCloseTo(6896.3, 2);
  });

  it('calculates amountSold as exit * shares', () => {
    const r = calcTrade('Long', 6896.3, 6891, 6899.14, 1, null);
    expect(r.amountSold).toBeCloseTo(6899.14, 2);
  });
});
