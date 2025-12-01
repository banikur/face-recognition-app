import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import Database from "better-sqlite3";

export const auth = betterAuth({
  secret: (process.env.BETTER_AUTH_SECRET as string) || "dev_secret",
  baseURL: (process.env.BETTER_AUTH_URL as string) || "http://localhost:3000",
  database: new Database("./data/auth.db"),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [nextCookies()],
});

export type SessionUser = typeof auth.$Infer.Session.user;
export type SessionData = typeof auth.$Infer.Session.session;
