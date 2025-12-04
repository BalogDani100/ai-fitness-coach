const API_URL = "http://localhost:4000";

// ---------- AUTH ----------

export type User = {
  id: number;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.headers) {
    const optHeaders = options.headers as Record<string, string>;
    for (const [key, value] of Object.entries(optHeaders)) {
      baseHeaders[key] = value;
    }
  }

  if (token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: baseHeaders,
  });

  if (!res.ok) {
    const text = await res.text();
    let message = `Request failed with status ${res.status}`;
    try {
      const json = JSON.parse(text) as { message?: string };
      if (json.message) {
        message = json.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export function loginRequest(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerRequest(email: string, password: string) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// ---------- PROFILE / MACROS ----------

export type Macros = {
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
};

export type FitnessProfile = {
  id: number;
  userId: number;
  gender: string;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: string;
  goalType: string;
  trainingDays: string;
};

export type ProfileMeResponse = {
  profile: FitnessProfile | null;
  macros: Macros | null;
};

export function getProfileMe(token: string) {
  return request<ProfileMeResponse>("/profile/me", {}, token);
}

export type UpsertProfileRequest = {
  gender: "male" | "female";
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: "light" | "moderate" | "high";
  goalType: "LOSE_FAT" | "GAIN_MUSCLE" | "MAINTAIN";
  trainingDays: string;
};

export type UpsertProfileResponse = {
  profile: FitnessProfile;
  macros: Macros;
};

export function upsertProfile(token: string, data: UpsertProfileRequest) {
  return request<UpsertProfileResponse>(
    "/profile/upsert",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token
  );
}

// ---------- WORKOUTS ----------

export type WorkoutExerciseTemplate = {
  id: number;
  workoutTemplateId: number;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  rir: number;
  orderIndex: number;
};

export type WorkoutTemplate = {
  id: number;
  userId: number;
  name: string;
  createdAt: string;
  exercises: WorkoutExerciseTemplate[];
};

export type GetWorkoutTemplatesResponse = {
  templates: WorkoutTemplate[];
};

export type CreateWorkoutTemplateRequestExercise = {
  name: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  rir: number;
};

export type CreateWorkoutTemplateRequest = {
  name: string;
  exercises: CreateWorkoutTemplateRequestExercise[];
};

export type CreateWorkoutTemplateResponse = {
  template: WorkoutTemplate;
};

export function getWorkoutTemplates(token: string) {
  return request<GetWorkoutTemplatesResponse>("/workouts/templates", {}, token);
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

export type WorkoutSet = {
  id: number;
  workoutLogId: number;
  exerciseTemplateId: number;
  setIndex: number;
  weightKg: number;
  reps: number;
  rir: number | null;
  exerciseTemplate: WorkoutExerciseTemplate;
};

export type WorkoutLogTemplateRef = {
  id: number;
  name: string;
};

export type WorkoutLog = {
  id: number;
  userId: number;
  date: string;
  workoutTemplateId: number | null;
  notes: string | null;
  createdAt: string;
  workoutTemplate: WorkoutLogTemplateRef | null;
  sets: WorkoutSet[];
};

export type GetWorkoutLogsResponse = {
  logs: WorkoutLog[];
};

export type WorkoutSetInput = {
  exerciseTemplateId: number;
  setIndex: number;
  weightKg: number;
  reps: number;
  rir?: number;
};

export type CreateWorkoutLogRequest = {
  date: string;
  workoutTemplateId?: number | null;
  notes?: string | null;
  sets?: WorkoutSetInput[];
};

export type CreateWorkoutLogResponse = {
  log: WorkoutLog;
};

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

// ---------- NUTRITION / MEALS ----------

export type MealEntry = {
  id: number;
  userId: number;
  date: string; // ISO string
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
};

export type MealDailyTotal = {
  date: string; // "YYYY-MM-DD"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type GetMealEntriesResponse = {
  entries: MealEntry[];
  totals: MealDailyTotal[];
};

export type CreateMealEntryRequest = {
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type CreateMealEntryResponse = {
  entry: MealEntry;
};

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

// ---------- AI FEEDBACK / COACH ----------

export type AiFeedback = {
  id: number;
  userId: number;
  dateFrom: string;
  dateTo: string;
  feedbackType: string; // "WEEKLY_REVIEW" | "WORKOUT_PLAN" | "MEAL_PLAN" | ...
  inputSummary: string;
  resultText: string;
  createdAt: string;
};

export type GetAiFeedbacksResponse = {
  feedbacks: AiFeedback[];
};

export type CreateWeeklyReviewResponse = {
  feedback: AiFeedback;
};

export type CreateWorkoutPlanResponse = {
  feedback: AiFeedback;
};

export type CreateMealPlanResponse = {
  feedback: AiFeedback;
};

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

// ---------- STATS / PROGRESS ----------

export type NutritionDailyStat = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type WorkoutVolumeStat = {
  muscleGroup: string;
  sets: number;
};

export type WorkoutSessionsPerDayStat = {
  date: string;
  sessions: number;
};

export type StatsOverviewResponse = {
  nutritionDaily: NutritionDailyStat[];
  macros: Macros | null;
  workoutSessionsPerDay: WorkoutSessionsPerDayStat[];
  workoutVolumeByMuscleGroup: WorkoutVolumeStat[];
};

export function getStatsOverview(token: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  const query = params.toString();
  const path = query ? `/stats/overview?${query}` : "/stats/overview";

  return request<StatsOverviewResponse>(path, {}, token);
}
