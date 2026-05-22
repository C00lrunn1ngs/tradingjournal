# Trading Journal Dashboard — Implementation Plan: Phase 3
# Dashboard UI · Trade Log · Trade Form · Stats · Admin · Excel Import

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Phase 1 + Phase 2 complete (auth, layouts, APIs all working).

**Goal:** Build all UI components and pages: dashboard, trade log, trade form, stats page, admin users page, and the one-time Excel import script.

---

## File Map (Phase 3)

- Create: `src/components/StatCard.tsx`
- Create: `src/components/EquityCurve.tsx`
- Create: `src/components/DrawdownMeter.tsx`
- Create: `src/components/MonthlyPnlChart.tsx`
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/components/TradeTable.tsx`
- Create: `src/components/DeleteConfirmModal.tsx`
- Create: `src/app/(dashboard)/trades/page.tsx`
- Create: `src/components/TradeForm.tsx`
- Create: `src/app/(dashboard)/trades/new/page.tsx`
- Create: `src/app/(dashboard)/trades/[id]/edit/page.tsx`
- Create: `src/app/(dashboard)/stats/page.tsx`
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/route.ts`
- Create: `src/app/(dashboard)/admin/users/page.tsx`
- Create: `scripts/import-excel.ts`

---

## Task 11: Dashboard UI Components

**Files:**
- Create: `src/components/StatCard.tsx`
- Create: `src/components/DrawdownMeter.tsx`
- Create: `src/components/EquityCurve.tsx`
- Create: `src/components/MonthlyPnlChart.tsx`

- [ ] **Step 11.1: Write `src/components/StatCard.tsx`**

```typescript
interface Props {
  label: string;
  value: string;
  sub?: string;
  color?: 'white' | 'green' | 'red' | 'yellow' | 'blue';
}

const colorMap = {
  white:  'text-tj-text',
  green:  'text-tj-teal',
  red:    'text-tj-red',
  yellow: 'text-tj-yellow',
  blue:   'text-tj-blue',
};

export default function StatCard({ label, value, sub, color = 'white' }: Props) {
  return (
    <div className="bg-tj-card border border-tj-border rounded-xl p-4">
      <p className="text-[10px] font-semibold text-tj-muted2 uppercase tracking-[.8px] mb-2">
        {label}
      </p>
      <p className={`text-[22px] font-bold font-mono leading-none ${colorMap[color]}`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-tj-muted2 font-mono mt-1.5">{sub}</p>}
    </div>
  );
}
```

- [ ] **Step 11.2: Write `src/components/DrawdownMeter.tsx`**

```typescript
interface Props {
  drawdown: number;
  maxDrawdown: number;
}

export default function DrawdownMeter({ drawdown, maxDrawdown }: Props) {
  const pct = Math.min(100, (drawdown / maxDrawdown) * 100);
  const status = pct < 50 ? 'safe' : pct < 80 ? 'warn' : 'danger';
  const fillColor = status === 'safe' ? '#00d4aa' : status === 'warn' ? '#ffd166' : '#ff6b6b';
  const statusText =
    status === 'safe'   ? `✓ Veilig — ${pct.toFixed(1)}% benut` :
    status === 'warn'   ? `⚠ Waarschuwing — ${pct.toFixed(1)}% benut` :
                          `✗ Gevaar — ${pct.toFixed(1)}% benut`;
  const statusBg =
    status === 'safe'   ? 'bg-[#081a14] border-[#0a3028] text-tj-teal' :
    status === 'warn'   ? 'bg-[#1a1500] border-[#3a3000] text-tj-yellow' :
                          'bg-[#1a0808] border-[#3a1010] text-tj-red';

  return (
    <div className="flex flex-col justify-center gap-2">
      <p className={`text-[32px] font-bold font-mono leading-none text-center`} style={{ color: fillColor }}>
        €{drawdown.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}
      </p>
      <p className="text-[11px] text-tj-muted text-center">
        van max €{maxDrawdown.toLocaleString('nl-NL')}
      </p>

      <div className="bg-[#0a1520] rounded-md h-2 overflow-hidden">
        <div
          className="h-full rounded-md transition-all"
          style={{ width: `${pct}%`, background: fillColor }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-tj-muted2">
        <span>€0</span>
        <span style={{ color: '#ffd166' }}>€{(maxDrawdown / 2).toLocaleString('nl-NL')}</span>
        <span style={{ color: '#ff6b6b' }}>€{maxDrawdown.toLocaleString('nl-NL')}</span>
      </div>

      <div className={`text-center text-[12px] font-medium border rounded-lg py-2 ${statusBg}`}>
        {statusText}
      </div>
    </div>
  );
}
```

- [ ] **Step 11.3: Write `src/components/EquityCurve.tsx`**

```typescript
'use client';

interface Point { date: string; equity: number; }
interface Props {
  data: Point[];
  startingBalance: number;
  maxDrawdown: number;
}

function catmullToBezier(pts: [number, number][], t = 0.38): string {
  if (pts.length < 2) return '';
  const d = [`M ${pts[0][0]},${pts[0][1]}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = p1[0] + (p2[0] - p0[0]) * t;
    const cp1y = p1[1] + (p2[1] - p0[1]) * t;
    const cp2x = p2[0] - (p3[0] - p1[0]) * t;
    const cp2y = p2[1] - (p3[1] - p1[1]) * t;
    d.push(`C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2[0]},${p2[1]}`);
  }
  return d.join(' ');
}

const W = 760, H = 130, PAD = { t: 18, r: 48, b: 28, l: 10 };

export default function EquityCurve({ data, startingBalance, maxDrawdown }: Props) {
  if (data.length < 2) {
    return <div className="flex items-center justify-center h-32 text-tj-muted2 text-sm">Geen data</div>;
  }

  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const equities = data.map(d => d.equity);
  const minE = Math.min(...equities, startingBalance - maxDrawdown * 0.2);
  const maxE = Math.max(...equities, startingBalance + 100);
  const range = maxE - minE || 1;

  const toX = (i: number) => PAD.l + (i / Math.max(data.length - 1, 1)) * cW;
  const toY = (e: number) => PAD.t + cH - ((e - minE) / range) * cH;

  const baseY  = toY(startingBalance);
  const maxDdY = toY(startingBalance - maxDrawdown);
  const pts: [number, number][] = data.map((d, i) => [toX(i), toY(d.equity)]);
  const linePath   = catmullToBezier(pts);
  const closedPath = `${linePath} L ${pts[pts.length-1][0]},${baseY} L ${pts[0][0]},${baseY} Z`;
  const endEquity  = data[data.length - 1].equity;

  const fmt = (s: string) => {
    const d = new Date(s);
    return d.toLocaleDateString('nl-NL', { month: 'short', year: '2-digit' });
  };

  return (
    <div>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <clipPath id="ec-above"><rect x="0" y="0" width={W} height={baseY} /></clipPath>
          <clipPath id="ec-below"><rect x="0" y={baseY} width={W} height={H} /></clipPath>
          <linearGradient id="ec-green" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00d4aa" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#00d4aa" stopOpacity={0.03} />
          </linearGradient>
          <linearGradient id="ec-red" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6b6b" stopOpacity={0.03} />
            <stop offset="100%" stopColor="#ff6b6b" stopOpacity={0.4} />
          </linearGradient>
        </defs>

        {/* Baseline */}
        <line x1={PAD.l} y1={baseY} x2={W - PAD.r} y2={baseY}
              stroke="#2a4a5a" strokeWidth={1} strokeDasharray="5,4" />
        <text x={PAD.l + 4} y={baseY - 4} fill="#3a6a7a" fontSize={9}
              fontFamily="'JetBrains Mono', monospace">
          €{startingBalance.toLocaleString('nl-NL')}
        </text>

        {/* Max drawdown line */}
        {maxDdY < H && (
          <>
            <line x1={PAD.l} y1={maxDdY} x2={W - PAD.r} y2={maxDdY}
                  stroke="#8b2020" strokeWidth={1} strokeDasharray="4,4" opacity={0.6} />
            <text x={PAD.l + 4} y={maxDdY + 12} fill="#8b3030" fontSize={9}
                  fontFamily="'JetBrains Mono', monospace">
              Max DD −€{maxDrawdown.toLocaleString('nl-NL')}
            </text>
          </>
        )}

        {/* Fills */}
        <path d={closedPath} fill="url(#ec-green)" clipPath="url(#ec-above)" />
        <path d={closedPath} fill="url(#ec-red)"   clipPath="url(#ec-below)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#00d4aa" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" />

        {/* End label */}
        <text x={pts[pts.length-1][0] + 4} y={pts[pts.length-1][1] + 4}
              fill="#e2f0f7" fontSize={9} fontFamily="'JetBrains Mono', monospace">
          €{endEquity.toLocaleString('nl-NL', { maximumFractionDigits: 0 })}
        </text>
      </svg>

      <div className="flex justify-between mt-1 text-[10px] font-mono text-tj-muted2 px-0.5">
        <span>{fmt(data[0].date)}</span>
        {data.length > 2 && <span>{fmt(data[Math.floor(data.length / 2)].date)}</span>}
        <span>{fmt(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 11.4: Write `src/components/MonthlyPnlChart.tsx`**

```typescript
'use client';
import { BarChart, Bar, XAxis, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Props {
  data: { month: string; pl: number }[];
}

export default function MonthlyPnlChart({ data }: Props) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-24 text-tj-muted2 text-sm">Geen data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={90}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: '#3a5a6a', fontFamily: 'Inter, sans-serif' }}
          axisLine={false}
          tickLine={false}
        />
        <ReferenceLine y={0} stroke="#1a2e40" />
        <Bar dataKey="pl" radius={[3, 3, 0, 0]} maxBarSize={40}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.pl >= 0 ? '#00d4aa' : '#ff6b6b'}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 11.5: Commit**

```bash
git add src/components/StatCard.tsx src/components/DrawdownMeter.tsx src/components/EquityCurve.tsx src/components/MonthlyPnlChart.tsx
git commit -m "feat: add dashboard UI components (StatCard, DrawdownMeter, EquityCurve, MonthlyPnlChart)"
```

---

## Task 12: Dashboard Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 12.1: Write `src/app/(dashboard)/dashboard/page.tsx`**

```typescript
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import StatCard from '@/components/StatCard';
import EquityCurve from '@/components/EquityCurve';
import DrawdownMeter from '@/components/DrawdownMeter';
import MonthlyPnlChart from '@/components/MonthlyPnlChart';
import type { DashboardStats, Trade } from '@/lib/types';

async function getStats(userId: number): Promise<DashboardStats | null> {
  // Import db here to keep this a server component
  const { db, sql } = await import('@/lib/db');
  const { verifyToken: _ } = await import('@/lib/auth');

  const userResult = await db(
    'SELECT starting_balance, max_drawdown FROM users WHERE id = @id',
    { id: { type: sql.Int, value: userId } }
  );
  const user = userResult.recordset[0] as { starting_balance: number; max_drawdown: number } | undefined;
  if (!user) return null;

  // Re-use the stats API logic inline for SSR
  const res = await fetch(`http://localhost:${process.env.PORT ?? 3000}/api/dashboard/stats`, {
    headers: { Cookie: (await cookies()).toString() },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json() as Promise<DashboardStats>;
}

async function getRecentTrades(userId: number): Promise<Trade[]> {
  const { db, sql } = await import('@/lib/db');
  const r = await db(
    `SELECT TOP 5 * FROM trades WHERE user_id = @userId AND total_pl IS NOT NULL
     ORDER BY trade_date DESC, created_at DESC`,
    { userId: { type: sql.Int, value: userId } }
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
    getStats(payload.userId),
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
```

- [ ] **Step 12.2: Start dev server and verify dashboard in browser**

```bash
npm run dev
```

Open http://localhost:3000/dashboard — verify all cards, charts render correctly.

- [ ] **Step 12.3: Commit**

```bash
git add src/app/(dashboard)/dashboard/
git commit -m "feat: add dashboard page with equity curve, drawdown meter, and recent trades"
```

---

## Task 13: Trade Log — TradeTable Component + Trades Page

**Files:**
- Create: `src/components/DeleteConfirmModal.tsx`
- Create: `src/components/TradeTable.tsx`
- Create: `src/app/(dashboard)/trades/page.tsx`

- [ ] **Step 13.1: Write `src/components/DeleteConfirmModal.tsx`**

```typescript
'use client';

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeleteConfirmModal({ onConfirm, onCancel, loading }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-tj-card border border-tj-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-base font-semibold text-tj-text mb-2">Trade verwijderen?</h3>
        <p className="text-sm text-tj-muted mb-6">Deze actie kan niet ongedaan worden gemaakt.</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-tj-border text-tj-text2 text-sm hover:bg-tj-hover transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-tj-red text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Verwijderen...' : 'Verwijderen'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 13.2: Write `src/components/TradeTable.tsx`**

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DeleteConfirmModal from './DeleteConfirmModal';
import type { Trade } from '@/lib/types';

interface Props {
  trades: Trade[];
  total: number;
  page: number;
  pages: number;
  typeFilter: string;
  onFilterChange: (type: string) => void;
  onPageChange: (page: number) => void;
}

export default function TradeTable({
  trades, total, page, pages, typeFilter, onFilterChange, onPageChange,
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function confirmDelete(id: number) {
    setDeleteLoading(true);
    await fetch(`/api/trades/${id}`, { method: 'DELETE' });
    setDeleting(null);
    setDeleteLoading(false);
    router.refresh();
  }

  const fmtPl = (n: number | null) => {
    if (n == null) return '—';
    return (n >= 0 ? '+' : '−') + '€' + Math.abs(n).toFixed(2);
  };
  const fmtR = (n: number | null) => {
    if (n == null) return '—';
    return (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(2) + 'R';
  };

  return (
    <>
      {deleting !== null && (
        <DeleteConfirmModal
          onConfirm={() => confirmDelete(deleting)}
          onCancel={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {['Alle', 'Long', 'Short'].map(t => (
            <button
              key={t}
              onClick={() => onFilterChange(t === 'Alle' ? '' : t)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                (t === 'Alle' && typeFilter === '') || typeFilter === t
                  ? 'bg-tj-active border-[#006655] text-tj-teal'
                  : 'bg-tj-hover border-tj-border text-tj-muted hover:text-tj-text2'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <a
          href="/trades/new"
          className="bg-tj-teal text-[#06120f] text-[12px] font-semibold rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
        >
          + Nieuwe trade
        </a>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-tj-border">
              {['Datum','Symbool','Type','Tijdstip','Entry','Exit','P&L','R','Acties'].map(h => (
                <th key={h} className="text-left px-2.5 py-2 text-[10px] font-semibold text-tj-muted2 uppercase tracking-[.6px]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 && (
              <tr>
                <td colSpan={9} className="px-2.5 py-8 text-center text-tj-muted">
                  Geen trades gevonden
                </td>
              </tr>
            )}
            {trades.map(t => (
              <tr key={t.id} className="border-b border-[#0d1a26] hover:bg-tj-hover">
                <td className="px-2.5 py-2.5 font-mono text-tj-muted">
                  {new Date(t.trade_date).toLocaleDateString('nl-NL', { day:'2-digit', month:'short', year:'2-digit' })}
                </td>
                <td className="px-2.5 py-2.5 font-mono font-semibold text-tj-text">{t.symbol}</td>
                <td className="px-2.5 py-2.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    t.trade_type === 'Long'
                      ? 'bg-[#0a2535] text-tj-blue border-[#1a3a50]'
                      : 'bg-[#2a1010] text-[#ff9a7a] border-[#3a2010]'
                  }`}>{t.trade_type}</span>
                </td>
                <td className="px-2.5 py-2.5 text-tj-muted">{t.time_of_trade ?? '—'}</td>
                <td className="px-2.5 py-2.5 font-mono text-tj-text2">
                  {t.entry_price?.toLocaleString('nl-NL', { maximumFractionDigits: 4 })}
                </td>
                <td className="px-2.5 py-2.5 font-mono text-tj-text2">
                  {t.exit_price?.toLocaleString('nl-NL', { maximumFractionDigits: 4 }) ?? '—'}
                </td>
                <td className={`px-2.5 py-2.5 font-mono font-bold ${(t.total_pl ?? 0) >= 0 ? 'text-tj-teal' : 'text-tj-red'}`}>
                  {fmtPl(t.total_pl)}
                </td>
                <td className={`px-2.5 py-2.5 font-mono font-bold ${(t.r_multiple ?? 0) >= 0 ? 'text-tj-teal' : 'text-tj-red'}`}>
                  {fmtR(t.r_multiple)}
                </td>
                <td className="px-2.5 py-2.5">
                  <a href={`/trades/${t.id}/edit`}
                     className="border border-tj-border rounded px-2 py-1 text-[11px] text-tj-muted hover:border-tj-teal hover:text-tj-teal transition-colors mr-1.5">
                    ✏
                  </a>
                  <button
                    onClick={() => setDeleting(t.id)}
                    className="border border-tj-border rounded px-2 py-1 text-[11px] text-tj-muted hover:border-tj-red hover:text-tj-red transition-colors"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-[12px]">
          <span className="text-tj-muted">{total} trades</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-tj-border text-tj-text2 disabled:opacity-30 hover:bg-tj-hover transition-colors"
            >
              ← Vorige
            </button>
            <span className="px-3 py-1.5 text-tj-muted">
              {page} / {pages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
              className="px-3 py-1.5 rounded-lg border border-tj-border text-tj-text2 disabled:opacity-30 hover:bg-tj-hover transition-colors"
            >
              Volgende →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 13.3: Write `src/app/(dashboard)/trades/page.tsx`**

```typescript
'use client';
import { useState, useEffect, useCallback } from 'react';
import TradeTable from '@/components/TradeTable';
import type { Trade } from '@/lib/types';

interface TradesResponse {
  trades: Trade[];
  total: number;
  page: number;
  pages: number;
}

export default function TradesPage() {
  const [data, setData] = useState<TradesResponse | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadTrades = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (typeFilter) params.set('type', typeFilter);
    const res = await fetch(`/api/trades?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [page, typeFilter]);

  useEffect(() => { loadTrades(); }, [loadTrades]);

  function handleFilterChange(type: string) {
    setTypeFilter(type);
    setPage(1);
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-tj-text mb-5">Trade Log</h1>
      <div className="bg-tj-card border border-tj-border rounded-xl p-5">
        {loading && !data ? (
          <p className="text-tj-muted py-8 text-center">Laden...</p>
        ) : (
          <TradeTable
            trades={data?.trades ?? []}
            total={data?.total ?? 0}
            page={data?.page ?? 1}
            pages={data?.pages ?? 1}
            typeFilter={typeFilter}
            onFilterChange={handleFilterChange}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 13.4: Verify in browser**

Open http://localhost:3000/trades — verify table, filters, and pagination work.

- [ ] **Step 13.5: Commit**

```bash
git add src/components/DeleteConfirmModal.tsx src/components/TradeTable.tsx src/app/(dashboard)/trades/page.tsx
git commit -m "feat: add trade log page with filtering, pagination, and delete confirmation"
```

---

## Task 14: Trade Form + New/Edit Pages

**Files:**
- Create: `src/components/TradeForm.tsx`
- Create: `src/app/(dashboard)/trades/new/page.tsx`
- Create: `src/app/(dashboard)/trades/[id]/edit/page.tsx`

- [ ] **Step 14.1: Write `src/components/TradeForm.tsx`**

```typescript
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calcTrade } from '@/lib/calculations';
import type { Trade } from '@/lib/types';

interface Props {
  initial?: Partial<Trade>;
  tradeId?: number;
}

const TIME_OPTIONS = ['Morning', 'Mid Day', 'Afternoon'];

export default function TradeForm({ initial, tradeId }: Props) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ pl: number; r: number | null } | null>(null);

  // Form state
  const [form, setForm] = useState({
    trade_date:     initial?.trade_date     ?? new Date().toISOString().split('T')[0],
    symbol:         initial?.symbol         ?? '',
    trade_type:     initial?.trade_type     ?? 'Long' as 'Long' | 'Short',
    time_of_trade:  initial?.time_of_trade  ?? '',
    strategy:       initial?.strategy       ?? '',
    entry_price:    initial?.entry_price    ? String(initial.entry_price) : '',
    stop_loss:      initial?.stop_loss      ? String(initial.stop_loss)   : '',
    shares:         initial?.shares         ? String(initial.shares)      : '1',
    exit_price:     initial?.exit_price     ? String(initial.exit_price)  : '',
    commission:     initial?.commission     ? String(initial.commission)  : '',
    notes:          initial?.notes          ?? '',
    screenshot_url: initial?.screenshot_url ?? '',
    issue:          initial?.issue          ?? '',
  });

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  // Auto-calculate preview
  useEffect(() => {
    const entry = parseFloat(form.entry_price);
    const exit  = parseFloat(form.exit_price);
    const sl    = parseFloat(form.stop_loss);
    const sh    = parseInt(form.shares);
    const comm  = parseFloat(form.commission) || 0;
    if (!isNaN(entry) && !isNaN(exit) && sh > 0) {
      const calc = calcTrade(form.trade_type, entry, isNaN(sl) ? null : sl, exit, sh, comm || null);
      setPreview({ pl: calc.totalPl, r: calc.rMultiple });
    } else {
      setPreview(null);
    }
  }, [form.trade_type, form.entry_price, form.exit_price, form.stop_loss, form.shares, form.commission]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      trade_date:     form.trade_date,
      symbol:         form.symbol.toUpperCase(),
      trade_type:     form.trade_type,
      time_of_trade:  form.time_of_trade || null,
      strategy:       form.strategy      || null,
      entry_price:    parseFloat(form.entry_price),
      stop_loss:      form.stop_loss ? parseFloat(form.stop_loss) : null,
      shares:         parseInt(form.shares),
      exit_price:     form.exit_price ? parseFloat(form.exit_price) : null,
      commission:     form.commission ? parseFloat(form.commission) : null,
      notes:          form.notes          || null,
      screenshot_url: form.screenshot_url || null,
      issue:          form.issue          || null,
    };

    const url    = tradeId ? `/api/trades/${tradeId}` : '/api/trades';
    const method = tradeId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push('/trades');
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error ?? 'Opslaan mislukt');
      setLoading(false);
    }
  }

  const inputCls = 'w-full bg-tj-bg border border-tj-border rounded-lg px-3 py-2 text-tj-text text-sm font-mono placeholder-tj-muted focus:outline-none focus:border-tj-teal focus:ring-1 focus:ring-tj-teal';
  const labelCls = 'block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Row 1: date, symbol, type, time */}
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className={labelCls}>Datum *</label>
          <input type="date" required value={form.trade_date}
            onChange={e => set('trade_date', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Symbool *</label>
          <input type="text" required placeholder="US500" value={form.symbol}
            onChange={e => set('symbol', e.target.value.toUpperCase())} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Type *</label>
          <select value={form.trade_type} onChange={e => set('trade_type', e.target.value)} className={inputCls}>
            <option value="Long">Long</option>
            <option value="Short">Short</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Tijdstip</label>
          <select value={form.time_of_trade} onChange={e => set('time_of_trade', e.target.value)} className={inputCls}>
            <option value="">—</option>
            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2: entry, stop loss, shares, exit */}
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className={labelCls}>Entry prijs *</label>
          <input type="number" step="any" required placeholder="6896.30" value={form.entry_price}
            onChange={e => set('entry_price', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Stop loss *</label>
          <input type="number" step="any" required placeholder="6891.07" value={form.stop_loss}
            onChange={e => set('stop_loss', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Shares / Contracten *</label>
          <input type="number" min="1" required value={form.shares}
            onChange={e => set('shares', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Exit prijs</label>
          <input type="number" step="any" placeholder="6899.14" value={form.exit_price}
            onChange={e => set('exit_price', e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="bg-tj-active border border-tj-border rounded-xl px-4 py-3 flex gap-8">
          <div>
            <p className="text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide">Berekende P&L</p>
            <p className={`text-lg font-bold font-mono mt-0.5 ${preview.pl >= 0 ? 'text-tj-teal' : 'text-tj-red'}`}>
              {preview.pl >= 0 ? '+' : '−'}€{Math.abs(preview.pl).toFixed(2)}
            </p>
          </div>
          {preview.r != null && (
            <div>
              <p className="text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide">R-multiple</p>
              <p className={`text-lg font-bold font-mono mt-0.5 ${preview.r >= 0 ? 'text-tj-teal' : 'text-tj-red'}`}>
                {preview.r >= 0 ? '+' : '−'}{Math.abs(preview.r).toFixed(2)}R
              </p>
            </div>
          )}
        </div>
      )}

      {/* Row 3: strategy, commission */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Strategie</label>
          <input type="text" placeholder="Bijv. Breakout" value={form.strategy}
            onChange={e => set('strategy', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Commissie (€)</label>
          <input type="number" step="0.01" min="0" placeholder="0.00" value={form.commission}
            onChange={e => set('commission', e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Notes, screenshot, issue */}
      <div>
        <label className={labelCls}>Notities</label>
        <textarea rows={3} placeholder="Trade journaal aantekeningen..."
          value={form.notes} onChange={e => set('notes', e.target.value)}
          className={inputCls + ' resize-none'} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Screenshot URL</label>
          <input type="url" placeholder="https://prnt.sc/..." value={form.screenshot_url}
            onChange={e => set('screenshot_url', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Issue / Fout</label>
          <input type="text" placeholder="Bijv. SL te krap" value={form.issue}
            onChange={e => set('issue', e.target.value)} className={inputCls} />
        </div>
      </div>

      {error && (
        <p className="text-sm text-tj-red bg-[#1a0808] border border-[#2a1010] rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <a href="/trades"
           className="px-5 py-2.5 rounded-lg border border-tj-border text-tj-text2 text-sm hover:bg-tj-hover transition-colors">
          Annuleren
        </a>
        <button type="submit" disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-tj-teal text-[#06120f] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? 'Opslaan...' : tradeId ? 'Bijwerken' : 'Trade opslaan'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 14.2: Write `src/app/(dashboard)/trades/new/page.tsx`**

```typescript
import TradeForm from '@/components/TradeForm';

export default function NewTradePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-bold text-tj-text mb-5">Nieuwe Trade</h1>
      <div className="bg-tj-card border border-tj-border rounded-xl p-6">
        <TradeForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 14.3: Write `src/app/(dashboard)/trades/[id]/edit/page.tsx`**

```typescript
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { db, sql } from '@/lib/db';
import TradeForm from '@/components/TradeForm';
import type { Trade } from '@/lib/types';

export default async function EditTradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tradeId = parseInt(id);
  if (isNaN(tradeId)) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) notFound();

  const result = await db(
    'SELECT * FROM trades WHERE id = @id AND user_id = @userId',
    {
      id:     { type: sql.Int, value: tradeId },
      userId: { type: sql.Int, value: payload.userId },
    }
  );
  const trade = result.recordset[0] as Trade | undefined;
  if (!trade) notFound();

  // Convert Date to string for the form
  const initial: Partial<Trade> = {
    ...trade,
    trade_date: new Date(trade.trade_date).toISOString().split('T')[0],
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-bold text-tj-text mb-5">Trade bewerken</h1>
      <div className="bg-tj-card border border-tj-border rounded-xl p-6">
        <TradeForm initial={initial} tradeId={tradeId} />
      </div>
    </div>
  );
}
```

- [ ] **Step 14.4: Verify new trade form and edit form in browser**

Open http://localhost:3000/trades/new — fill in a trade, verify P&L preview updates live.
Submit and verify the trade appears in /trades.
Click edit (✏) on the trade, change a value, save — verify it updates.

- [ ] **Step 14.5: Commit**

```bash
git add src/components/TradeForm.tsx src/app/(dashboard)/trades/new/ src/app/(dashboard)/trades/
git commit -m "feat: add trade form with live P&L preview and new/edit pages"
```

---

## Task 15: Stats Page

**Files:**
- Create: `src/app/(dashboard)/stats/page.tsx`

- [ ] **Step 15.1: Write `src/app/(dashboard)/stats/page.tsx`**

```typescript
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { db, sql } from '@/lib/db';
import type { DashboardStats } from '@/lib/types';

async function getStats(): Promise<DashboardStats | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return null;
  const res = await fetch(
    `http://localhost:${process.env.PORT ?? 3000}/api/dashboard/stats`,
    { headers: { Cookie: cookieStore.toString() }, cache: 'no-store' }
  );
  if (!res.ok) return null;
  return res.json();
}

async function getSymbolBreakdown(userId: number) {
  const { db, sql } = await import('@/lib/db');
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
    { userId: { type: sql.Int, value: userId } }
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
    getStats(),
    getSymbolBreakdown(payload.userId),
  ]);

  if (!stats) return <p className="text-tj-muted">Kon statistieken niet laden.</p>;

  const avgWin  = stats.winCount  > 0 ? stats.totalPl / stats.winCount  : 0;
  const avgLoss = stats.lossCount > 0 ? stats.totalPl / stats.lossCount : 0;

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
```

- [ ] **Step 15.2: Commit**

```bash
git add src/app/(dashboard)/stats/
git commit -m "feat: add statistics page with win/loss breakdown and per-symbol analysis"
```

---

## Task 16: Admin API + Users Page

**Files:**
- Create: `src/app/api/admin/users/route.ts`
- Create: `src/app/api/admin/users/[id]/route.ts`
- Create: `src/app/(dashboard)/admin/users/page.tsx`

- [ ] **Step 16.1: Write `src/app/api/admin/users/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, sql } from '@/lib/db';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

function getAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const p = token ? verifyToken(token) : null;
  return p?.role === 'admin' ? p : null;
}

// GET /api/admin/users
export async function GET(req: NextRequest) {
  if (!getAdmin(req)) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  const r = await db('SELECT id, username, email, role, starting_balance, max_drawdown, created_at FROM users ORDER BY created_at');
  return NextResponse.json(r.recordset);
}

// POST /api/admin/users — create new user
export async function POST(req: NextRequest) {
  if (!getAdmin(req)) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const body = await req.json().catch(() => ({})) as {
    username?: string; email?: string; password?: string; role?: string;
    starting_balance?: number; max_drawdown?: number;
  };

  if (!body.username || !body.email || !body.password) {
    return NextResponse.json({ error: 'username, email en password zijn verplicht' }, { status: 400 });
  }

  const hash = await bcrypt.hash(body.password, 12);

  await db(
    `INSERT INTO users (username, email, password_hash, role, starting_balance, max_drawdown)
     VALUES (@username, @email, @hash, @role, @starting_balance, @max_drawdown)`,
    {
      username:         { type: sql.NVarChar(50),  value: body.username },
      email:            { type: sql.NVarChar(100), value: body.email },
      hash:             { type: sql.NVarChar(255), value: hash },
      role:             { type: sql.NVarChar(10),  value: body.role === 'admin' ? 'admin' : 'user' },
      starting_balance: { type: sql.Decimal(12,2), value: body.starting_balance ?? 45000 },
      max_drawdown:     { type: sql.Decimal(12,2), value: body.max_drawdown     ?? 2000  },
    }
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
```

- [ ] **Step 16.2: Write `src/app/api/admin/users/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const p = token ? verifyToken(token) : null;
  if (!p || p.role !== 'admin') return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const { id } = await params;
  const targetId = parseInt(id);
  if (isNaN(targetId)) return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 });
  if (targetId === p.userId) return NextResponse.json({ error: 'Je kunt jezelf niet verwijderen' }, { status: 400 });

  await db('DELETE FROM users WHERE id = @id', { id: { type: sql.Int, value: targetId } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 16.3: Write `src/app/(dashboard)/admin/users/page.tsx`**

```typescript
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number; username: string; email: string; role: string;
  starting_balance: number; max_drawdown: number; created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username:'', email:'', password:'', role:'user', starting_balance:'45000', max_drawdown:'2000' });

  async function load() {
    const r = await fetch('/api/admin/users');
    if (r.ok) setUsers(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, starting_balance: +form.starting_balance, max_drawdown: +form.max_drawdown }),
    });
    setShowForm(false);
    setLoading(false);
    setForm({ username:'', email:'', password:'', role:'user', starting_balance:'45000', max_drawdown:'2000' });
    await load();
  }

  async function deleteUser(id: number) {
    if (!confirm('Gebruiker verwijderen? Dit verwijdert ook al zijn trades.')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    await load();
  }

  const inp = 'w-full bg-tj-bg border border-tj-border rounded-lg px-3 py-2 text-tj-text text-sm font-mono placeholder-tj-muted focus:outline-none focus:border-tj-teal';

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-tj-text">Gebruikersbeheer</h1>
        <button onClick={() => setShowForm(s => !s)}
          className="bg-tj-teal text-[#06120f] text-[12px] font-semibold rounded-lg px-4 py-2 hover:opacity-90">
          + Nieuwe gebruiker
        </button>
      </div>

      {showForm && (
        <div className="bg-tj-card border border-tj-border rounded-xl p-5 mb-5">
          <h2 className="text-sm font-semibold text-tj-text mb-4">Nieuwe gebruiker aanmaken</h2>
          <form onSubmit={createUser} className="grid grid-cols-2 gap-4">
            <div><label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1">Gebruikersnaam *</label>
              <input required value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))} className={inp} /></div>
            <div><label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1">E-mail *</label>
              <input type="email" required value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} className={inp} /></div>
            <div><label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1">Wachtwoord *</label>
              <input type="password" required value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} className={inp} /></div>
            <div><label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1">Rol</label>
              <select value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))} className={inp}>
                <option value="user">Gebruiker</option>
                <option value="admin">Admin</option>
              </select></div>
            <div><label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1">Startkapitaal (€)</label>
              <input type="number" value={form.starting_balance} onChange={e => setForm(f=>({...f,starting_balance:e.target.value}))} className={inp} /></div>
            <div><label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1">Max Drawdown (€)</label>
              <input type="number" value={form.max_drawdown} onChange={e => setForm(f=>({...f,max_drawdown:e.target.value}))} className={inp} /></div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-tj-border text-tj-text2 text-sm hover:bg-tj-hover">Annuleren</button>
              <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-tj-teal text-[#06120f] text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                {loading ? 'Aanmaken...' : 'Aanmaken'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-tj-card border border-tj-border rounded-xl overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-tj-border">
              {['Gebruikersnaam','E-mail','Rol','Startkapitaal','Max DD','Aangemaakt','Acties'].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold text-tj-muted2 uppercase tracking-[.6px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-[#0d1a26] hover:bg-tj-hover">
                <td className="px-3 py-3 font-mono font-semibold text-tj-text">{u.username}</td>
                <td className="px-3 py-3 text-tj-text2">{u.email}</td>
                <td className="px-3 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${u.role === 'admin' ? 'bg-[#0a2535] text-tj-blue border-[#1a3a50]' : 'bg-tj-hover text-tj-muted border-tj-border'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-3 py-3 font-mono text-tj-text2">€{Number(u.starting_balance).toLocaleString('nl-NL')}</td>
                <td className="px-3 py-3 font-mono text-tj-text2">€{Number(u.max_drawdown).toLocaleString('nl-NL')}</td>
                <td className="px-3 py-3 text-tj-muted">{new Date(u.created_at).toLocaleDateString('nl-NL')}</td>
                <td className="px-3 py-3">
                  <button onClick={() => deleteUser(u.id)}
                    className="border border-tj-border rounded px-2 py-1 text-[11px] text-tj-muted hover:border-tj-red hover:text-tj-red transition-colors">
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 16.4: Commit**

```bash
git add src/app/api/admin/ src/app/(dashboard)/admin/
git commit -m "feat: add admin users management (list, create, delete)"
```

---

## Task 17: Excel Import Script

**Files:**
- Create: `scripts/import-excel.ts`

- [ ] **Step 17.1: Write `scripts/import-excel.ts`**

```typescript
import * as XLSX from 'xlsx';
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import path from 'path';
import 'dotenv/config';

const config: sql.config = {
  server: process.env.DB_SERVER!,
  port: parseInt(process.env.DB_PORT ?? '1433'),
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: { trustServerCertificate: process.env.DB_TRUST_CERT === 'true', enableArithAbort: true },
};

async function main() {
  const pool = await new sql.ConnectionPool(config).connect();
  console.log('✓ Connected to MSSQL');

  // 1. Create admin user
  const password = 'TraderAdmin2026!'; // Change this immediately after import
  const hash = await bcrypt.hash(password, 12);

  // Check if user already exists
  const existing = await pool.request()
    .input('username', sql.NVarChar(50), 'remco')
    .query('SELECT id FROM users WHERE username = @username');

  let userId: number;
  if (existing.recordset.length > 0) {
    userId = existing.recordset[0].id;
    console.log(`✓ User 'remco' already exists (id=${userId}), skipping creation`);
  } else {
    const userResult = await pool.request()
      .input('username',         sql.NVarChar(50),  'remco')
      .input('email',            sql.NVarChar(100), 'remco@denelzen.net')
      .input('password_hash',    sql.NVarChar(255), hash)
      .input('role',             sql.NVarChar(10),  'admin')
      .input('starting_balance', sql.Decimal(12,2), 45000.00)
      .input('max_drawdown',     sql.Decimal(12,2), 2000.00)
      .query(`INSERT INTO users (username, email, password_hash, role, starting_balance, max_drawdown)
              OUTPUT INSERTED.id
              VALUES (@username, @email, @password_hash, @role, @starting_balance, @max_drawdown)`);
    userId = userResult.recordset[0].id;
    console.log(`✓ Created admin user 'remco' (id=${userId}), password: ${password}`);
    console.log('  ⚠ Change this password immediately after import!');
  }

  // 2. Read Excel
  const xlsxPath = path.join(process.cwd(), 'TradeAcademy Excel Logboek.xlsx');
  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const ws = wb.Sheets['TRADES'];
  const allRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

  // Row 7 (index 6) = headers, Row 8+ (index 7+) = data
  const dataRows = allRows.slice(7) as unknown[][];

  let imported = 0;
  let skipped  = 0;

  for (const row of dataRows) {
    const rawDate = row[0]; // DATE
    if (!rawDate) continue; // Skip empty rows

    // Parse date: XLSX with cellDates returns JS Date objects
    let tradeDate: Date;
    if (rawDate instanceof Date) {
      tradeDate = rawDate;
    } else if (typeof rawDate === 'number') {
      // Excel serial date fallback
      tradeDate = new Date((rawDate - 25569) * 86400000);
    } else {
      skipped++;
      continue;
    }

    const tradeDateStr = tradeDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const symbol       = String(row[1] ?? '').trim();
    const tradeType    = String(row[2] ?? '').trim() as 'Long' | 'Short';
    const timeOfTrade  = row[3] ? String(row[3]).trim() : null;
    const strategy     = row[4] ? String(row[4]).trim() : null;
    const entryPrice   = parseFloat(String(row[5]))  || 0;
    const stopLoss     = row[6]  != null ? parseFloat(String(row[6])) : null;
    const shares       = parseInt(String(row[8]))    || 1;
    const exitPrice    = row[11] != null ? parseFloat(String(row[11])) : null;
    const amtInvested  = row[13] != null ? parseFloat(String(row[13])) : entryPrice * shares;
    const amtSold      = row[14] != null ? parseFloat(String(row[14])) : null;
    const totalPl      = row[15] != null ? parseFloat(String(row[15])) : null;
    const percentGain  = row[16] != null ? parseFloat(String(row[16])) : null;
    const rMultiple    = row[17] != null ? parseFloat(String(row[17])) : null;
    const issue        = row[18] ? String(row[18]).trim() : null;
    const notes        = row[19] ? String(row[19]).trim() : null;
    const screenshotUrl = row[20] ? String(row[20]).trim() : null;
    const commission   = row[21] != null ? parseFloat(String(row[21])) : null;

    if (!symbol || !tradeType) { skipped++; continue; }

    await pool.request()
      .input('user_id',        sql.Int,           userId)
      .input('trade_date',     sql.Date,          tradeDateStr)
      .input('symbol',         sql.NVarChar(20),  symbol)
      .input('trade_type',     sql.NVarChar(5),   tradeType)
      .input('time_of_trade',  sql.NVarChar(20),  timeOfTrade)
      .input('strategy',       sql.NVarChar(100), strategy)
      .input('entry_price',    sql.Decimal(12,4), entryPrice)
      .input('stop_loss',      sql.Decimal(12,4), isNaN(stopLoss!) ? null : stopLoss)
      .input('shares',         sql.Int,           shares)
      .input('exit_price',     sql.Decimal(12,4), exitPrice)
      .input('amount_invested',sql.Decimal(12,2), Math.round(amtInvested * 100) / 100)
      .input('amount_sold',    sql.Decimal(12,2), amtSold ? Math.round(amtSold * 100) / 100 : null)
      .input('total_pl',       sql.Decimal(12,2), totalPl  != null ? Math.round(totalPl * 100) / 100 : null)
      .input('percent_gain',   sql.Decimal(10,6), percentGain)
      .input('r_multiple',     sql.Decimal(8,4),  rMultiple)
      .input('commission',     sql.Decimal(8,2),  commission)
      .input('notes',          sql.NVarChar(sql.MAX), notes)
      .input('screenshot_url', sql.NVarChar(500), screenshotUrl)
      .input('issue',          sql.NVarChar(sql.MAX), issue)
      .query(`INSERT INTO trades
        (user_id, trade_date, symbol, trade_type, time_of_trade, strategy,
         entry_price, stop_loss, shares, exit_price, amount_invested, amount_sold,
         total_pl, percent_gain, r_multiple, commission, notes, screenshot_url, issue)
        VALUES
        (@user_id, @trade_date, @symbol, @trade_type, @time_of_trade, @strategy,
         @entry_price, @stop_loss, @shares, @exit_price, @amount_invested, @amount_sold,
         @total_pl, @percent_gain, @r_multiple, @commission, @notes, @screenshot_url, @issue)`);
    imported++;
  }

  console.log(`✓ Imported ${imported} trades (${skipped} skipped)`);
  await pool.close();
}

main().catch(err => { console.error('Import failed:', err); process.exit(1); });
```

- [ ] **Step 17.2: Run the import script**

```bash
npm run import-excel
```

Expected output:
```
✓ Connected to MSSQL
✓ Created admin user 'remco' (id=1), password: TraderAdmin2026!
  ⚠ Change this password immediately after import!
✓ Imported 22 trades (0 skipped)
```

- [ ] **Step 17.3: Verify data in database**

Connect to SQL Server and run:
```sql
SELECT COUNT(*) FROM trades WHERE user_id = 1;
SELECT trade_date, symbol, trade_type, total_pl FROM trades WHERE user_id = 1 ORDER BY trade_date;
```

Expected: 22 rows, all with correct dates and P&L values.

- [ ] **Step 17.4: Test the full login flow**

```
npm run dev
```
Open http://localhost:3000, should redirect to /login.
Login with username `remco`, password `TraderAdmin2026!`.
Verify:
- Dashboard shows 22 trades, equity curve, drawdown meter
- /trades shows all 22 trades with pagination
- /stats shows win rate ~41%, total P&L ~−€126

- [ ] **Step 17.5: Change the admin password via /admin/users**

In the browser: go to /admin/users → create a new user entry for remco (or update via SQL):
```sql
UPDATE users SET password_hash = 'new-bcrypt-hash' WHERE username = 'remco';
```

Or use the running app: log in, go to /admin/users, delete and recreate the user with a secure password. Alternatively, add a change-password feature in a future iteration.

- [ ] **Step 17.6: Final commit**

```bash
git add scripts/import-excel.ts
git commit -m "feat: add Excel import script — creates admin user and imports 22 trades"
```

---

## Phase 3 Complete — Project Done

All features implemented:

- ✓ Dashboard with equity curve (green/red split), drawdown meter, stat cards, monthly P&L, recent trades
- ✓ Trade log with pagination (25/page), Long/Short filter, edit and delete with confirmation
- ✓ Trade form with live P&L + R-multiple preview, shared for new and edit
- ✓ Statistics page with win/loss breakdown and per-symbol analysis
- ✓ Admin users page (create, delete)
- ✓ Excel import: 22 trades loaded under admin user 'remco'
- ✓ All routes protected by JWT middleware
- ✓ SQL injection prevention via parameterized queries

**Start the app:**
```bash
npm run dev
# Open http://localhost:3000
# Login: remco / TraderAdmin2026! (change immediately)
```
