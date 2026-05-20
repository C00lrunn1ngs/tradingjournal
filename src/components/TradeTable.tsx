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
