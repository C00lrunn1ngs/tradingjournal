import sql from 'mssql';

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

declare global {
  // eslint-disable-next-line no-var
  var _sqlPool: sql.ConnectionPool | undefined;
}

async function getPool(): Promise<sql.ConnectionPool> {
  if (!global._sqlPool || !global._sqlPool.connected) {
    global._sqlPool = await new sql.ConnectionPool(config).connect();
  }
  return global._sqlPool;
}

// Pass params as plain values — mssql v12 type-matching is broken when using sql.Type()
// wrappers from the public API (different references than internal TYPES). Auto-detection works.
export async function db(
  queryStr: string,
  params?: Record<string, unknown>
): Promise<sql.IResult<unknown>> {
  const pool = await getPool();
  const req = pool.request();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      req.input(key, value);
    }
  }
  return req.query(queryStr);
}

export { sql };
