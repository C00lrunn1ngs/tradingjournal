import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

const VALID_LEVELS = [
  { starting_balance: 45000,  max_drawdown: 2000 },
  { starting_balance: 90000,  max_drawdown: 4000 },
  { starting_balance: 180000, max_drawdown: 8000 },
  { starting_balance: 360000, max_drawdown: 16000 },
];

function getAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const p = token ? verifyToken(token) : null;
  return p?.role === 'admin' ? p : null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = getAdmin(req);
  if (!p) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const { id } = await params;
  const targetId = parseInt(id);
  if (isNaN(targetId)) return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 });

  const body = await req.json().catch(() => ({})) as { starting_balance?: number; max_drawdown?: number };
  const level = VALID_LEVELS.find(
    l => l.starting_balance === body.starting_balance && l.max_drawdown === body.max_drawdown
  );
  if (!level) return NextResponse.json({ error: 'Ongeldig account niveau' }, { status: 400 });

  await db(
    'UPDATE users SET starting_balance = @sb, max_drawdown = @md WHERE id = @id',
    { sb: level.starting_balance, md: level.max_drawdown, id: targetId }
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = getAdmin(req);
  if (!p) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const { id } = await params;
  const targetId = parseInt(id);
  if (isNaN(targetId)) return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 });
  if (targetId === p.userId) return NextResponse.json({ error: 'Je kunt jezelf niet verwijderen' }, { status: 400 });

  await db('DELETE FROM users WHERE id = @id', { id: targetId });
  return NextResponse.json({ ok: true });
}
