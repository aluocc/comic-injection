"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost, ApiError } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";

interface RegisterResponse {
  token: string;
  user: AuthUser;
}

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    if (password.length < 8 || password.length > 32) {
      setError("密码长度需为 8-32 位");
      return;
    }
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      setError("密码需至少包含一个字母和一个数字");
      return;
    }

    setLoading(true);
    try {
      const data = await apiPost<RegisterResponse>("/auth/register", {
        email: email.trim(),
        password,
        nickname: nickname.trim(),
      });
      login(data.token, data.user);
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 1001) {
          setError("该邮箱已被注册");
        } else {
          setError(err.message || "注册失败");
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
        <h1 className="text-2xl font-bold tracking-tight">注册账号</h1>
        <p className="mt-1 text-sm text-foreground/60">
          创建账号以开始你的多语种学习之旅。
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="邮箱">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputCls}
            />
          </Field>
          <Field label="昵称">
            <input
              type="text"
              required
              minLength={1}
              maxLength={32}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="1-32 位字符"
              className={inputCls}
            />
          </Field>
          <Field label="密码" hint="8-32 位，需含字母与数字">
            <input
              type="password"
              required
              minLength={8}
              maxLength={32}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="确认密码">
            <input
              type="password"
              required
              minLength={8}
              maxLength={32}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputCls}
            />
          </Field>

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
            {loading ? "注册中…" : "注册"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/60">
          已有账号？{" "}
          <Link
            href="/login"
            className="font-medium text-brand-600 hover:underline"
          >
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-brand-800 dark:bg-transparent";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-foreground">
        {label}
        {hint && (
          <span className="text-xs font-normal text-foreground/50">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}
