import { request } from "../../../shared/api/http";
import type {
  CreateMealEntryRequest,
  CreateMealEntryResponse,
  GetMealEntriesResponse,
} from "./nutrition.dto";

export function getMealEntries(token: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  const query = params.toString();
  const path = query ? `/nutrition/entries?${query}` : "/nutrition/entries";

  return request<GetMealEntriesResponse>(path, {}, token);
}

export function createMealEntry(token: string, data: CreateMealEntryRequest) {
  return request<CreateMealEntryResponse>(
    "/nutrition/entries",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token
  );
}

export function deleteMealEntry(token: string, id: number) {
  return request<{ success: boolean }>(
    `/nutrition/entries/${id}`,
    {
      method: "DELETE",
    },
    token
  );
}
