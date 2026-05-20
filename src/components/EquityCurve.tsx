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
