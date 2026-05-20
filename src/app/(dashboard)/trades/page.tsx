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
