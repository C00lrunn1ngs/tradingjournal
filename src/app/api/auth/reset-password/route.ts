import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: 'Wachtwoord minimaal 8 tekens' }, { status: 400 });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const result = await db(
    'SELECT id FROM users WHERE reset_token_hash = @hash AND reset_token_expires > @now',
    { hash: tokenHash, now: new Date() }
  );

  if (result.recordset.length === 0) {
    return NextResponse.json({ error: 'Link is ongeldig of verlopen' }, { status: 400 });
  }

  const userId = (result.recordset[0] as { id: number }).id;
  const passwordHash = await bcrypt.hash(password, 12);

  await db(
    'UPDATE users SET password_hash = @hash, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = @id',
    { hash: passwordHash, id: userId }
  );

  return NextResponse.json({ ok: true });
}
