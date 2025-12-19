import { request } from "../../../shared/api/http";
import type { StatsOverviewResponse } from "./progress.dto";

export function getStatsOverview(token: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  const query = params.toString();
  const path = query ? `/stats/overview?${query}` : "/stats/overview";

  return request<StatsOverviewResponse>(path, {}, token);
}
