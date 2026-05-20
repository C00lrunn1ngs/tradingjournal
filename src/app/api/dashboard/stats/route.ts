import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import type { User, DashboardStats } from '@/lib/types';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });

  const userId = payload.userId;

  const userResult = await db(
    'SELECT starting_balance, max_drawdown FROM users WHERE id = @id',
    { id: { type: sql.Int, value: userId } }
  );
  const user = userResult.recordset[0] as Pick<User, 'starting_balance' | 'max_drawdown'>;
  if (!user) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });

  const aggResult = await db(
    `SELECT
       COUNT(*)                                                     AS trade_count,
       SUM(CASE WHEN total_pl >= 0 THEN 1 ELSE 0 END)              AS win_count,
       SUM(CASE WHEN total_pl <  0 THEN 1 ELSE 0 END)              AS loss_count,
       ISNULL(SUM(total_pl), 0)                                     AS total_pl,
       ISNULL(AVG(NULLIF(r_multiple, NULL)), 0)                     AS avg_r
     FROM trades
     WHERE user_id = @userId AND total_pl IS NOT NULL`,
    { userId: { type: sql.Int, value: userId } }
  );
  const agg = aggResult.recordset[0] as {
    trade_count: number; win_count: number; loss_count: number;
    total_pl: number; avg_r: number;
  };

  const monthlyResult = await db(
    `SELECT
       FORMAT(trade_date, 'MMM yy', 'nl-NL') AS month,
       SUM(total_pl)                          AS pl,
       YEAR(trade_date)                       AS yr,
       MONTH(trade_date)                      AS mo
     FROM trades
     WHERE user_id = @userId AND total_pl IS NOT NULL
     GROUP BY FORMAT(trade_date, 'MMM yy', 'nl-NL'), YEAR(trade_date), MONTH(trade_date)
     ORDER BY YEAR(trade_date), MONTH(trade_date)`,
    { userId: { type: sql.Int, value: userId } }
  );
  const monthlyPnl = (monthlyResult.recordset as { month: string; pl: number }[])
    .map(r => ({ month: r.month, pl: Number(r.pl) }));

  const histResult = await db(
    `SELECT trade_date, total_pl
     FROM trades
     WHERE user_id = @userId AND total_pl IS NOT NULL
     ORDER BY trade_date, created_at`,
    { userId: { type: sql.Int, value: userId } }
  );
  const histRows = histResult.recordset as { trade_date: Date; total_pl: number }[];

  let runningEquity = Number(user.starting_balance);
  const equityHistory: { date: string; equity: number }[] = [
    { date: histRows[0]?.trade_date.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0], equity: runningEquity },
  ];
  for (const row of histRows) {
    runningEquity = Math.round((runningEquity + Number(row.total_pl)) * 100) / 100;
    equityHistory.push({
      date: row.trade_date.toISOString().split('T')[0],
      equity: runningEquity,
    });
  }

  const startingBalance = Number(user.starting_balance);
  const maxDrawdown     = Number(user.max_drawdown);
  const totalPl         = Number(agg.total_pl);
  const currentEquity   = Math.round((startingBalance + totalPl) * 100) / 100;
  const drawdown        = Math.max(0, Math.round((startingBalance - currentEquity) * 100) / 100);
  const winRate         = agg.trade_count > 0 ? agg.win_count / agg.trade_count : 0;

  const stats: DashboardStats = {
    currentEquity,
    startingBalance,
    maxDrawdown,
    totalPl,
    tradeCount:   Number(agg.trade_count),
    winCount:     Number(agg.win_count),
    lossCount:    Number(agg.loss_count),
    winRate,
    avgRMultiple: Math.round(Number(agg.avg_r) * 1000) / 1000,
    drawdown,
    monthlyPnl,
    equityHistory,
  };

  return NextResponse.json(stats);
}
