"use client";

import { useHealth } from "@/hooks/use-health";

/**
 * Demonstrates the frontend <-> backend integration by calling /health
 * through the react-query hook + axios unwrapping.
 */
export function HealthStatus() {
  const { data, isLoading, isError } = useHealth();
  const ok = data?.status === "ok";

  return (
    <div className="mt-6 flex items-center gap-3 text-sm">
      <span
        className={`inline-flex h-2.5 w-2.5 rounded-full ${
          isLoading
            ? "bg-foreground/30"
            : ok
              ? "bg-accent-500"
              : "bg-rose-500"
        }`}
      />
      {isLoading && <span className="text-foreground/60">正在检查后端连接…</span>}
      {ok && (
        <span className="text-accent-700 dark:text-accent-400">
          后端联调正常（/health 返回 ok）
        </span>
      )}
      {isError && (
        <span className="text-rose-600 dark:text-rose-400">
          后端未连接（请启动 backend: pnpm start:dev）
        </span>
      )}
    </div>
  );
}
