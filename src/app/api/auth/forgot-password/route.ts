import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'E-mail verplicht' }, { status: 400 });

  const result = await db('SELECT id FROM users WHERE email = @email', { email });
  // Always respond OK to prevent email enumeration
  if (result.recordset.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db(
    'UPDATE users SET reset_token_hash = @hash, reset_token_expires = @expires WHERE email = @email',
    { hash: tokenHash, expires, email }
  );

  try {
    await sendPasswordResetEmail(email, token);
  } catch (err) {
    console.error('Email sending failed:', err);
    return NextResponse.json({ error: 'E-mail versturen mislukt. Controleer SMTP-instellingen.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
