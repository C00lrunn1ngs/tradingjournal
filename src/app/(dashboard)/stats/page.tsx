import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { db } from '@/lib/db';
import { getDashboardStats } from '@/lib/stats';

async function getSymbolBreakdown(userId: number) {
  const r = await db(
    `SELECT symbol,
       COUNT(*)                                       AS trades,
       SUM(CASE WHEN total_pl >= 0 THEN 1 ELSE 0 END) AS wins,
       ISNULL(SUM(total_pl), 0)                       AS total_pl,
       ISNULL(AVG(r_multiple), 0)                     AS avg_r
     FROM trades
     WHERE user_id = @userId AND total_pl IS NOT NULL
     GROUP BY symbol
     ORDER BY total_pl DESC`,
    { userId }
  );
  return r.recordset as { symbol: string; trades: number; wins: number; total_pl: number; avg_r: number }[];
}

function fmtEur(n: number) {
  return (n < 0 ? '−' : '+') + '€' + Math.abs(n).toLocaleString('nl-NL', { maximumFractionDigits: 2 });
}

export default async function StatsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) redirect('/login');

  const [stats, symbols] = await Promise.all([
    getDashboardStats(payload.userId),
    getSymbolBreakdown(payload.userId),
  ]);

  if (!stats) return <p className="text-tj-muted">Kon statistieken niet laden.</p>;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-bold text-tj-text">Statistieken</h1>

      {/* Overview grid */}
      <div className="grid grid-cols-4 gap-3.5">
        {[
          { label: 'Totaal trades',   value: String(stats.tradeCount),                           color: 'text-tj-text' },
          { label: 'Win rate',        value: `${(stats.winRate * 100).toFixed(1)}%`,             color: 'text-tj-teal' },
          { label: 'Gem. R',          value: `${stats.avgRMultiple >= 0 ? '+' : ''}${stats.avgRMultiple.toFixed(2)}R`, color: stats.avgRMultiple >= 0 ? 'text-tj-teal' : 'text-tj-red' },
          { label: 'Totaal P&L',      value: fmtEur(stats.totalPl),                              color: stats.totalPl >= 0 ? 'text-tj-teal' : 'text-tj-red' },
        ].map(c => (
          <div key={c.label} className="bg-tj-card border border-tj-border rounded-xl p-4">
            <p className="text-[10px] font-semibold text-tj-muted2 uppercase tracking-[.8px] mb-2">{c.label}</p>
            <p className={`text-[22px] font-bold font-mono leading-none ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Wins / losses breakdown */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-tj-card border border-tj-border rounded-xl p-5">
          <p className="text-[11px] font-semibold text-tj-muted2 uppercase tracking-[.8px] mb-4">
            <span className="text-tj-teal">▸</span> Wins
          </p>
          <div className="space-y-2 text-[13px] font-mono">
            <div className="flex justify-between"><span className="text-tj-muted">Aantal wins</span><span className="text-tj-teal font-semibold">{stats.winCount}</span></div>
            <div className="flex justify-between"><span className="text-tj-muted">Totaal winstbedrag</span><span className="text-tj-teal font-semibold">+€{Math.max(0, stats.totalPl).toFixed(2)}</span></div>
          </div>
        </div>

        <div className="bg-tj-card border border-tj-border rounded-xl p-5">
          <p className="text-[11px] font-semibold text-tj-muted2 uppercase tracking-[.8px] mb-4">
            <span className="text-tj-red">▸</span> Verliezen
          </p>
          <div className="space-y-2 text-[13px] font-mono">
            <div className="flex justify-between"><span className="text-tj-muted">Aantal verliezen</span><span className="text-tj-red font-semibold">{stats.lossCount}</span></div>
            <div className="flex justify-between"><span className="text-tj-muted">Totaal verliesbedrag</span><span className="text-tj-red font-semibold">{fmtEur(Math.min(0, stats.totalPl))}</span></div>
          </div>
        </div>
      </div>

      {/* Per-symbol breakdown */}
      <div className="bg-tj-card border border-tj-border rounded-xl p-5">
        <p className="text-[11px] font-semibold text-tj-muted2 uppercase tracking-[.8px] mb-4">
          <span className="text-tj-teal">▸</span> Per Symbool
        </p>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-tj-border">
              {['Symbool','Trades','Win%','Gem. R','P&L'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-tj-muted2 uppercase tracking-[.6px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {symbols.map(s => (
              <tr key={s.symbol} className="border-b border-[#0d1a26] hover:bg-tj-hover">
                <td className="px-3 py-2.5 font-mono font-semibold text-tj-text">{s.symbol}</td>
                <td className="px-3 py-2.5 font-mono text-tj-text2">{s.trades}</td>
                <td className="px-3 py-2.5 font-mono text-tj-text2">{((s.wins / s.trades) * 100).toFixed(0)}%</td>
                <td className={`px-3 py-2.5 font-mono font-bold ${Number(s.avg_r) >= 0 ? 'text-tj-teal' : 'text-tj-red'}`}>
                  {Number(s.avg_r) >= 0 ? '+' : '−'}{Math.abs(Number(s.avg_r)).toFixed(2)}R
                </td>
                <td className={`px-3 py-2.5 font-mono font-bold ${Number(s.total_pl) >= 0 ? 'text-tj-teal' : 'text-tj-red'}`}>
                  {fmtEur(Number(s.total_pl))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
