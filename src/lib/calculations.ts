import type { TradeCalculations } from './types';

export function calcTrade(
  tradeType: 'Long' | 'Short',
  entryPrice: number,
  stopLoss: number | null,
  exitPrice: number,
  shares: number,
  commission: number | null
): TradeCalculations {
  const amountInvested = round2(entryPrice * shares);
  const amountSold = round2(exitPrice * shares);

  const rawPl =
    tradeType === 'Long'
      ? (exitPrice - entryPrice) * shares
      : (entryPrice - exitPrice) * shares;

  const totalPl = round2(rawPl - (commission ?? 0));

  const rMultiple =
    stopLoss != null
      ? round4(totalPl / (Math.abs(entryPrice - stopLoss) * shares))
      : null;

  const percentGain =
    amountInvested !== 0 ? round6(totalPl / amountInvested) : null;

  return { totalPl, rMultiple, percentGain, amountInvested, amountSold };
}

function round2(n: number) { return Math.round(n * 100) / 100; }
function round4(n: number) { return Math.round(n * 10000) / 10000; }
function round6(n: number) { return Math.round(n * 1000000) / 1000000; }
