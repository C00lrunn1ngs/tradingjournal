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

const W = 760, H = 160, PAD = { t: 16, r: 52, b: 28, l: 74 };

function fmtEur(v: number) {
  return '€' + v.toLocaleString('nl-NL', { maximumFractionDigits: 0 });
}

export default function EquityCurve({ data, startingBalance, maxDrawdown }: Props) {
  if (data.length < 2) {
    return <div className="flex items-center justify-center h-32 text-tj-muted2 text-sm">Geen data</div>;
  }

  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;

  const equities = data.map(d => d.equity);
  const minE = Math.min(...equities);
  const maxE = Math.max(...equities);
  const range = maxE - minE || 1;

  const toX = (i: number) => PAD.l + (i / Math.max(data.length - 1, 1)) * cW;
  const toY = (e: number) => PAD.t + cH - ((e - minE) / range) * cH;

  const topY    = PAD.t;
  const bottomY = PAD.t + cH;
  const baseY   = toY(startingBalance);
  const clampedBaseY = Math.max(topY, Math.min(bottomY, baseY));

  const pts: [number, number][] = data.map((d, i) => [toX(i), toY(d.equity)]);
  const linePath   = catmullToBezier(pts);
  const closedPath = `${linePath} L ${pts[pts.length - 1][0]},${clampedBaseY} L ${pts[0][0]},${clampedBaseY} Z`;

  const fmt = (s: string) => new Date(s).toLocaleDateString('nl-NL', { month: 'short', year: '2-digit' });

  // Label vertical positions — keep them from overlapping when close together
  const minLabelY = Math.min(bottomY + 4, H - 4);
  const maxLabelY = Math.max(topY + 10, 10);
  const baseLabelY = clampedBaseY - 4;

  // suppress baseline label if too close to min/max labels
  const showBaseLabel = Math.abs(clampedBaseY - topY) > 18 && Math.abs(clampedBaseY - bottomY) > 18;

  return (
    <div>
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <clipPath id="ec-above"><rect x={PAD.l} y={0} width={cW} height={clampedBaseY} /></clipPath>
          <clipPath id="ec-below"><rect x={PAD.l} y={clampedBaseY} width={cW} height={H} /></clipPath>
          <linearGradient id="ec-green" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#00d4aa" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#00d4aa" stopOpacity={0.03} />
          </linearGradient>
          <linearGradient id="ec-red" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ff6b6b" stopOpacity={0.03} />
            <stop offset="100%" stopColor="#ff6b6b" stopOpacity={0.35} />
          </linearGradient>
        </defs>

        {/* Top boundary — green dashed line (highest point) */}
        <line x1={PAD.l} y1={topY} x2={W - PAD.r} y2={topY}
              stroke="#4ade80" strokeWidth={1} strokeDasharray="5,4" opacity={0.6} />
        <text x={PAD.l - 4} y={maxLabelY}
              fill="#4ade80" fontSize={9.5} fontFamily="'JetBrains Mono', monospace"
              textAnchor="end">
          {fmtEur(maxE)}
        </text>

        {/* Bottom boundary — red dashed line (lowest point) */}
        <line x1={PAD.l} y1={bottomY} x2={W - PAD.r} y2={bottomY}
              stroke="#ff6b6b" strokeWidth={1} strokeDasharray="5,4" opacity={0.6} />
        <text x={PAD.l - 4} y={minLabelY}
              fill="#ff4444" fontSize={9.5} fontFamily="'JetBrains Mono', monospace"
              textAnchor="end">
          {fmtEur(minE)}
        </text>

        {/* Baseline (starting balance) — dashed, only when visible */}
        {clampedBaseY > topY && clampedBaseY < bottomY && (
          <>
            <line x1={PAD.l} y1={clampedBaseY} x2={W - PAD.r} y2={clampedBaseY}
                  stroke="#2a4a5a" strokeWidth={1} strokeDasharray="5,4" />
            {showBaseLabel && (
              <text x={PAD.l - 4} y={baseLabelY}
                    fill="#3a6a7a" fontSize={9} fontFamily="'JetBrains Mono', monospace"
                    textAnchor="end">
                {fmtEur(startingBalance)}
              </text>
            )}
          </>
        )}

        {/* Fills */}
        <path d={closedPath} fill="url(#ec-green)" clipPath="url(#ec-above)" />
        <path d={closedPath} fill="url(#ec-red)"   clipPath="url(#ec-below)" />

        {/* Curve */}
        <path d={linePath} fill="none" stroke="#00d4aa" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" />

        {/* End label */}
        <text x={pts[pts.length - 1][0] + 5} y={pts[pts.length - 1][1] + 4}
              fill="#e2f0f7" fontSize={9} fontFamily="'JetBrains Mono', monospace">
          {fmtEur(data[data.length - 1].equity)}
        </text>
      </svg>

      <div className="flex justify-between mt-1 text-[10px] font-mono text-tj-muted2"
           style={{ paddingLeft: PAD.l, paddingRight: PAD.r }}>
        <span>{fmt(data[0].date)}</span>
        {data.length > 2 && <span>{fmt(data[Math.floor(data.length / 2)].date)}</span>}
        <span>{fmt(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}
