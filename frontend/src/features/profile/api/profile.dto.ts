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
