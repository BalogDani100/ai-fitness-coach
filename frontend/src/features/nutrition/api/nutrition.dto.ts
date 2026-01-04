export type MealEntry = {
  id: number;
  userId: number;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
};

export type MealDailyTotal = {
  date: string;
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
