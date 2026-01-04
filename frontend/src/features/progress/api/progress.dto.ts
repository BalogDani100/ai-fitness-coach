import type { Macros } from "../../profile/api/profile.dto";

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
