import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export interface HealthData {
  status: string;
}

/**
 * Example hook that calls the backend `GET /health` endpoint via react-query.
 * Verifies the end-to-end integration: frontend -> axios -> unified envelope
 * unwrap -> backend health controller.
 */
export function useHealth() {
  return useQuery<HealthData>({
    queryKey: ["health"],
    queryFn: () => apiGet<HealthData>("/health"),
  });
}
