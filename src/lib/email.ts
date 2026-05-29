import nodemailer from 'nodemailer';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const appUrl = process.env.APP_URL ?? 'https://tradingjournal.denelzen.net';
  const resetUrl = `${appUrl}/reset-password/${token}`;
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER!;

  const transport = createTransport();
  await transport.sendMail({
    from,
    to,
    subject: 'Wachtwoord resetten — TradingJournal',
    text: `Klik op de onderstaande link om je wachtwoord te resetten (geldig 1 uur):\n\n${resetUrl}\n\nAls je dit niet hebt aangevraagd, kun je deze mail negeren.`,
    html: `
      <p>Klik op de onderstaande link om je wachtwoord te resetten (geldig 1 uur):</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Als je dit niet hebt aangevraagd, kun je deze mail negeren.</p>
    `,
  });
}
