"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await authClient.signIn.email(
        {
          email,
          password,
          callbackURL: "/admin",
        },
        {
          onError: (ctx) => {
            setError(ctx.error.message);
          },
        }
      );
      if (!error) {
        router.push("/admin");
      }
    } catch {
      setError("Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#111]">
            SkinLab
          </Link>
          <p className="text-sm text-[#111]/50 mt-1">Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
          <h1 className="text-lg font-semibold text-[#111] mb-5">Masuk</h1>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#111]/70 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@skinlab.com"
                required
                className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111]/70 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-lg bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#3B82F6] text-white text-sm font-medium rounded-lg hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#111]/40 mt-6">
          <Link href="/" className="hover:text-[#3B82F6]">
            ← Kembali ke beranda
          </Link>
        </p>
      </div>
    </div>
  );
}
