"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AdminLogin() {
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
    <div className="vh-full flex items-center justify-center bg-gray-50 p-[1vh] overflow-hidden">
      <div className="w-full max-w-sm bg-white rounded-md shadow p-[1vh]">
        <h1 className="text-base font-bold text-gray-900 mb-[1vh]">Admin Login</h1>
        <form onSubmit={onSubmit} className="space-y-[1vh]">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-[0.5vh]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-[1vh] py-[1vh] text-sm border border-gray-300 rounded-md focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-[0.5vh]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-[1vh] py-[1vh] text-sm border border-gray-300 rounded-md focus:outline-none"
            />
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-[1vh] py-[1vh] bg-blue-600 text-white text-sm rounded-md"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
