/**
 * Database URL dari environment variables.
 * Untuk Vercel: set DATABASE_URL di Environment Variables.
 * Atau set per komponen: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.
 */

export function getDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  if (!host || !user || !password || !database) {
    return undefined;
  }
  const enc = encodeURIComponent(password);
  const portPart = port ? `:${port}` : '';
  return `postgresql://${user}:${enc}@${host}${portPart}/${database}`;
}
