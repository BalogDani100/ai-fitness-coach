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
