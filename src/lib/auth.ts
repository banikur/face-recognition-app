import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

// Better-auth with Supabase PostgreSQL
// Note: better-auth requires a PostgreSQL connection string (server-side only)
// Get it from Supabase: Project Settings > Database > Connection string (URI)
// Format: postgresql://postgres:[password]@[host]:[port]/postgres

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!databaseUrl && process.env.NODE_ENV === 'production') {
  console.warn('Warning: DATABASE_URL not set. Authentication may not work in production.');
}

export const auth = betterAuth({
  secret: (process.env.BETTER_AUTH_SECRET as string) || "dev_secret",
  baseURL: (process.env.BETTER_AUTH_URL as string) || "http://localhost:3000",
  // Use PostgreSQL Pool for better-auth
  database: databaseUrl ? new Pool({
    connectionString: databaseUrl,
  }) : undefined,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [nextCookies()],
});

export type SessionUser = typeof auth.$Infer.Session.user;
export type SessionData = typeof auth.$Infer.Session.session;
