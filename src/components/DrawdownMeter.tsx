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
