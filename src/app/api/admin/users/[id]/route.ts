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
