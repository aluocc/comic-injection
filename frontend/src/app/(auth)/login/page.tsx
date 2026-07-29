"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiPost, ApiError } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const login = useAuthStore((s) => s.login);

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expired = search.get("expired") === "1";

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost<LoginResponse>("/auth/login", {
        account: account.trim(),
        password,
      });
      login(data.token, data.user);
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 1002) {
          setError("邮箱/手机号或密码错误");
        } else {
          setError(err.message || "登录失败");
        }
      } else {
        setError("网络异常，请稍后重试");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-brand-100 bg-white p-8 shadow-sm dark:border-brand-900 dark:bg-transparent">
        <h1 className="text-2xl font-bold tracking-tight">登录</h1>
        <p className="mt-1 text-sm text-foreground/60">
          使用邮箱或手机号登录你的账号。
        </p>

        {expired && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-300">
            登录已过期，请重新登录。
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              邮箱 / 手机号
            </span>
            <input
              type="text"
              required
              autoComplete="username"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              密码
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </label>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "登录中…" : "登录"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/60">
          还没有账号？{" "}
          <Link
            href="/register"
            className="font-medium text-brand-600 hover:underline"
          >
            去注册
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-brand-800 dark:bg-transparent";
