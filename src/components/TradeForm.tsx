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
