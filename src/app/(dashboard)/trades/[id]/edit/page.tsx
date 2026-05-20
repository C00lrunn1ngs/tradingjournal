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
