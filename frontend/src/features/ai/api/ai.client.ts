import { request } from "../../../shared/api/http";
import type {
  CreateMealPlanResponse,
  CreateWeeklyReviewResponse,
  CreateWorkoutPlanResponse,
  GetAiFeedbacksResponse,
} from "./ai.dto";

export function getAiFeedbacks(token: string) {
  return request<GetAiFeedbacksResponse>("/ai/feedbacks", {}, token);
}

export function createWeeklyReview(
  token: string,
  data?: { from?: string; to?: string }
) {
  return request<CreateWeeklyReviewResponse>(
    "/ai/weekly-review",
    {
      method: "POST",
      body: JSON.stringify(data ?? {}),
    },
    token
  );
}

export function createWorkoutPlan(
  token: string,
  data: {
    daysPerWeek: number;
    splitType: string;
    experience: string;
    notes?: string;
  }
) {
  return request<CreateWorkoutPlanResponse>(
    "/ai/workout-plan",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token
  );
}

export function createMealPlan(
  token: string,
  data: {
    mealsPerDay: number;
    preferences?: string;
    avoid?: string;
    notes?: string;
  }
) {
  return request<CreateMealPlanResponse>(
    "/ai/meal-plan",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token
  );
}
