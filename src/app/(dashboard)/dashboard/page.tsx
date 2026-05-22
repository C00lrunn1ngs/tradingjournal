import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { db } from '@/lib/db';
import { getDashboardStats } from '@/lib/stats';
import StatCard from '@/components/StatCard';
import EquityCurve from '@/components/EquityCurve';
import DrawdownMeter from '@/components/DrawdownMeter';
import MonthlyPnlChart from '@/components/MonthlyPnlChart';
import type { Trade } from '@/lib/types';

async function getRecentTrades(userId: number): Promise<Trade[]> {
  const r = await db(
    `SELECT TOP 5 * FROM trades WHERE user_id = @userId AND total_pl IS NOT NULL
     ORDER BY trade_date DESC, created_at DESC`,
    { userId }
  );
  return r.recordset as Trade[];
}

function fmtEur(n: number) {
  return (n < 0 ? '−' : '') + '€' + Math.abs(n).toLocaleString('nl-NL', { maximumFractionDigits: 2 });
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) redirect('/login');

  const [stats, recent] = await Promise.all([
    getDashboardStats(payload.userId),
    getRecentTrades(payload.userId),
  ]);

  if (!stats) {
    return <p className="text-tj-muted">Kon statistieken niet laden.</p>;
  }

  const ddPct = stats.maxDrawdown > 0 ? (stats.drawdown / stats.maxDrawdown) * 100 : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Drawdown danger banner */}
      {stats.drawdown >= stats.maxDrawdown && (
        <div className="bg-[#1a0808] border border-[#3a1010] rounded-xl px-4 py-3 text-tj-red font-semibold text-sm">
          ✗ Maximum drawdown bereikt — stop met handelen en evalueer je strategie.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-5 gap-3.5">
        <StatCard label="Huidig Saldo"   value={fmtEur(stats.currentEquity)} sub={`Start: ${fmtEur(stats.startingBalance)}`} color="white" />
        <StatCard label="Totaal P&L"      value={fmtEur(stats.totalPl)}       sub={`${stats.tradeCount} trades`}              color={stats.totalPl >= 0 ? 'green' : 'red'} />
        <StatCard label="Win Rate"        value={`${(stats.winRate * 100).toFixed(1)}%`} sub={`${stats.winCount}W — ${stats.lossCount}L`} color="green" />
        <StatCard label="Gem. R/Trade"    value={`${stats.avgRMultiple >= 0 ? '' : '−'}${Math.abs(stats.avgRMultiple).toFixed(2)}R`} sub="Doel: +1R" color={stats.avgRMultiple >= 0 ? 'blue' : 'red'} />
        <StatCard label="Drawdown"        value={fmtEur(stats.drawdown)}       sub={`${ddPct.toFixed(1)}% van max`}           color={ddPct < 50 ? 'green' : ddPct < 80 ? 'yellow' : 'red'} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-3.5">
        {/* Equity curve — 2/3 width */}
        <div className="col-span-2 bg-tj-card border border-tj-border rounded-xl p-4">
          <p className="text-[11px] font-semibold text-tj-muted2 uppercase tracking-[.8px] mb-3">
            <span className="text-tj-teal">▸</span> Equity Curve
          </p>
          <EquityCurve
            data={stats.equityHistory}
            startingBalance={stats.startingBalance}
            maxDrawdown={stats.maxDrawdown}
          />
        </div>

        {/* Drawdown meter — 1/3 width */}
        <div className="bg-tj-card border border-tj-border rounded-xl p-4">
          <p className="text-[11px] font-semibold text-tj-muted2 uppercase tracking-[.8px] mb-3">
            <span className="text-tj-teal">▸</span> Drawdown Meter
          </p>
          <DrawdownMeter drawdown={stats.drawdown} maxDrawdown={stats.maxDrawdown} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-3.5">
        {/* Monthly P&L */}
        <div className="bg-tj-card border border-tj-border rounded-xl p-4">
          <p className="text-[11px] font-semibold text-tj-muted2 uppercase tracking-[.8px] mb-3">
            <span className="text-tj-teal">▸</span> Maandelijkse P&L
          </p>
          <MonthlyPnlChart data={stats.monthlyPnl} />
        </div>

        {/* Recent trades */}
        <div className="col-span-2 bg-tj-card border border-tj-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-tj-muted2 uppercase tracking-[.8px]">
              <span className="text-tj-teal">▸</span> Recente Trades
            </p>
            <a href="/trades/new"
               className="bg-tj-teal text-[#06120f] text-xs font-semibold rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity">
              + Nieuwe trade
            </a>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-tj-border">
                {['Datum','Symbool','Type','Entry','P&L','R'].map(h => (
                  <th key={h} className="text-left px-2.5 py-1.5 text-[10px] font-semibold text-tj-muted2 uppercase tracking-[.6px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={6} className="px-2.5 py-4 text-tj-muted text-center">Nog geen trades</td></tr>
              )}
              {recent.map(t => (
                <tr key={t.id} className="border-b border-[#0d1a26] hover:bg-tj-hover">
                  <td className="px-2.5 py-2 font-mono text-tj-muted">
                    {new Date(t.trade_date).toLocaleDateString('nl-NL', { day:'2-digit', month:'short' })}
                  </td>
                  <td className="px-2.5 py-2 font-mono font-semibold text-tj-text">{t.symbol}</td>
                  <td className="px-2.5 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      t.trade_type === 'Long'
                        ? 'bg-[#0a2535] text-tj-blue border-[#1a3a50]'
                        : 'bg-[#2a1010] text-[#ff9a7a] border-[#3a2010]'
                    }`}>{t.trade_type}</span>
                  </td>
                  <td className="px-2.5 py-2 font-mono text-tj-text2">
                    {t.entry_price?.toLocaleString('nl-NL', { maximumFractionDigits: 2 })}
                  </td>
                  <td className={`px-2.5 py-2 font-mono font-bold ${(t.total_pl ?? 0) >= 0 ? 'text-tj-teal' : 'text-tj-red'}`}>
                    {(t.total_pl ?? 0) >= 0 ? '+' : '−'}€{Math.abs(t.total_pl ?? 0).toFixed(2)}
                  </td>
                  <td className={`px-2.5 py-2 font-mono font-bold ${(t.r_multiple ?? 0) >= 0 ? 'text-tj-teal' : 'text-tj-red'}`}>
                    {(t.r_multiple ?? 0) >= 0 ? '+' : '−'}{Math.abs(t.r_multiple ?? 0).toFixed(2)}R
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
