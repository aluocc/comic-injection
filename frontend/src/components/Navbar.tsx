"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Top navigation bar.
 * Shows "登录/注册" when logged out, "昵称 / 退出" when logged in.
 * Hydrates the auth store from localStorage on first client render.
 */
export function Navbar() {
  const router = useRouter();
  const { token, user, hydrated, hydrate, logout } = useAuthStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="border-b border-brand-100 bg-white/80 backdrop-blur dark:border-brand-900 dark:bg-transparent">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 text-base font-bold text-white shadow-sm">
            多
          </span>
          <span className="text-base font-semibold tracking-tight">
            多语种学习平台
          </span>
        </Link>
        <div className="flex items-center gap-6 text-sm text-foreground/70">
          <Link
            href="/courses"
            className="transition-colors hover:text-brand-600"
          >
            课程
          </Link>
          <Link
            href="/courses"
            className="transition-colors hover:text-brand-600"
          >
            词汇
          </Link>
          <Link
            href="/courses"
            className="transition-colors hover:text-brand-600"
          >
            练习
          </Link>
          {hydrated && token && user ? (
            <Link
              href="/community"
              className="rounded-lg px-3 py-1.5 font-medium text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/40"
            >
              社区
            </Link>
          ) : null}
          {hydrated && token && user ? (
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-1.5 font-medium text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/40"
            >
              学习中心
            </Link>
          ) : null}
          {hydrated && token && user ? (
            <Link
              href="/achievements"
              className="rounded-lg px-3 py-1.5 font-medium text-amber-700 transition-colors hover:bg-amber-50 hover:text-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40"
            >
              成就
            </Link>
          ) : null}
          {hydrated && token && user ? (
            user.targetLanguage ? (
              <Link
                href="/recommendation"
                className="rounded-lg px-3 py-1.5 font-medium text-violet-700 transition-colors hover:bg-violet-50 hover:text-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/40"
              >
                学习路径
              </Link>
            ) : (
              <Link
                href="/onboarding"
                className="rounded-lg bg-violet-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-violet-700"
              >
                开始我的学习路径
              </Link>
            )
          ) : null}
          {hydrated && token && user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1 text-sm font-medium text-foreground transition-colors hover:bg-brand-50 dark:border-brand-900 dark:bg-transparent"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-800/40 dark:text-brand-200">
                  {user.nickname.slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-[8rem] truncate">{user.nickname}</span>
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 font-medium text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-800 dark:bg-transparent dark:text-brand-300"
              >
                退出
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 font-medium transition-colors hover:text-brand-600"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand-600 px-4 py-1.5 font-medium text-white transition-colors hover:bg-brand-700"
              >
                注册
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
