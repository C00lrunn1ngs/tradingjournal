import 'dotenv/config';
import nodemailer from 'nodemailer';

console.log('=== SMTP test ===');
console.log('SMTP_HOST:  ', process.env.SMTP_HOST);
console.log('SMTP_PORT:  ', process.env.SMTP_PORT);
console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
console.log('SMTP_USER:  ', process.env.SMTP_USER);
console.log('SMTP_FROM:  ', process.env.SMTP_FROM);
console.log('APP_URL:    ', process.env.APP_URL);
console.log('');

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT ?? '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

transport.verify()
  .then(() => {
    console.log('✓ SMTP verbinding OK — stuur testmail...');
    return transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER!,
      to: process.env.SMTP_USER!,
      subject: 'TradingJournal SMTP test',
      text: 'Als je dit ziet, werkt de mailconfiguratie correct.',
    });
  })
  .then(info => {
    console.log('✓ Mail verzonden:', info.messageId);
    process.exit(0);
  })
  .catch(err => {
    console.error('✗ SMTP fout:', err.message);
    if (err.code) console.error('  Code:', err.code);
    if (err.response) console.error('  Server response:', err.response);
    process.exit(1);
  });
