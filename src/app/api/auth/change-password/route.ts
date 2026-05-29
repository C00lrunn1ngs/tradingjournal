import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 });
  if (newPassword.length < 8) return NextResponse.json({ error: 'Nieuw wachtwoord minimaal 8 tekens' }, { status: 400 });

  const result = await db('SELECT password_hash FROM users WHERE id = @id', { id: payload.userId });
  if (result.recordset.length === 0) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, (result.recordset[0] as { password_hash: string }).password_hash);
  if (!valid) return NextResponse.json({ error: 'Huidig wachtwoord is onjuist' }, { status: 400 });

  const newHash = await bcrypt.hash(newPassword, 12);
  await db('UPDATE users SET password_hash = @hash WHERE id = @id', { hash: newHash, id: payload.userId });

  return NextResponse.json({ ok: true });
}
