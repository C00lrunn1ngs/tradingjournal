import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const config: sql.config = {
  server: process.env.DB_SERVER!,
  ...(process.env.DB_INSTANCE ? {} : { port: parseInt(process.env.DB_PORT ?? '1433') }),
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: {
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
    ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {}),
  },
};

async function migrate() {
  const pool = await new sql.ConnectionPool(config).connect();
  const sqlText = fs.readFileSync(path.join(process.cwd(), 'scripts/migrate.sql'), 'utf8');
  await pool.request().query(sqlText);
  console.log('✓ Migration complete');
  await pool.close();
}

migrate().catch(err => { console.error('Migration failed:', err); process.exit(1); });
