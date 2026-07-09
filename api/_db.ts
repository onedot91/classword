import { neon } from '@neondatabase/serverless';

type SqlClient = ReturnType<typeof neon>;

declare const process: {
  readonly env: {
    readonly DATABASE_URL?: string;
  };
};

let cachedSql: SqlClient | null = null;

export function getSql(): SqlClient {
  if (cachedSql) {
    return cachedSql;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  cachedSql = neon(databaseUrl);
  return cachedSql;
}
