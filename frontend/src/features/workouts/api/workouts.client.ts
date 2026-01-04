import { request } from "../../../shared/api/http";
import type {
  CreateWorkoutLogRequest,
  CreateWorkoutLogResponse,
  CreateWorkoutTemplateRequest,
  CreateWorkoutTemplateResponse,
  GetWorkoutLogsResponse,
  GetWorkoutTemplatesResponse,
} from "./workouts.dto";

export function getWorkoutTemplates(token: string) {
  return request<GetWorkoutTemplatesResponse>(
    "/workouts/templates",
    {},
    token
  );
}

export function createWorkoutTemplate(
  token: string,
  data: CreateWorkoutTemplateRequest
) {
  return request<CreateWorkoutTemplateResponse>(
    "/workouts/templates",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token
  );
}

export function deleteWorkoutTemplate(token: string, id: number) {
  return request<{ success: boolean }>(
    `/workouts/templates/${id}`,
    {
      method: "DELETE",
    },
    token
  );
}

export function getWorkoutLogs(token: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  const query = params.toString();
  const path = query ? `/workouts/logs?${query}` : "/workouts/logs";

  return request<GetWorkoutLogsResponse>(path, {}, token);
}

export function createWorkoutLog(token: string, data: CreateWorkoutLogRequest) {
  return request<CreateWorkoutLogResponse>(
    "/workouts/logs",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token
  );
}

export function deleteWorkoutLog(token: string, id: number) {
  return request<{ success: boolean }>(
    `/workouts/logs/${id}`,
    {
      method: "DELETE",
    },
    token
  );
}
