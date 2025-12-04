import { Router } from "express";
import { prisma } from "../prisma";
import { authGuard, AuthRequest } from "../middlewares/auth.middleware";

export const statsRouter = Router();

statsRouter.use(authGuard);

function resolveRangeFromQuery(query: { from?: string; to?: string }) {
  const now = new Date();

  const end = query.to ? new Date(query.to) : now;
  const start = query.from
    ? new Date(query.from)
    : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000); // alap: utolsó 30 nap

  const startNorm = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
    0,
    0,
    0,
    0
  );
  const endNorm = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
    23,
    59,
    59,
    999
  );

  return { start: startNorm, end: endNorm };
}

function calculateMacrosForProfile(profile: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: string;
  activityLevel: string;
  goalType: string;
}) {
  const s = profile.gender === "female" ? -161 : 5;
  const bmr =
    10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + s;

  const activityFactor =
    profile.activityLevel === "high"
      ? 1.725
      : profile.activityLevel === "moderate"
      ? 1.55
      : profile.activityLevel === "light"
      ? 1.375
      : 1.2;

  const tdee = Math.round(bmr * activityFactor);

  let targetCalories = tdee;
  if (profile.goalType === "LOSE_FAT") {
    targetCalories = tdee - 400;
  } else if (profile.goalType === "GAIN_MUSCLE") {
    targetCalories = tdee + 200;
  }

  const proteinGrams = Math.round(profile.weightKg * 2);
  const fatGrams = Math.round(profile.weightKg * 0.8);
  const proteinCalories = proteinGrams * 4;
  const fatCalories = fatGrams * 9;
  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const carbGrams = Math.max(0, Math.round(carbCalories / 4));

  return {
    tdee,
    targetCalories,
    proteinGrams,
    fatGrams,
    carbGrams,
  };
}

/**
 * GET /stats/overview?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
statsRouter.get("/overview", async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const { from, to } = req.query as { from?: string; to?: string };
  const { start, end } = resolveRangeFromQuery({ from, to });

  try {
    const profile = await prisma.fitnessProfile.findUnique({
      where: { userId },
    });

    const macros = profile ? calculateMacrosForProfile(profile) : null;

    // Napi kaja stat
    const meals = await prisma.mealEntry.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: "asc" },
    });

    const nutritionMap = new Map<
      string,
      { calories: number; protein: number; carbs: number; fat: number }
    >();

    for (const m of meals) {
      const key = m.date.toISOString().slice(0, 10);
      const existing = nutritionMap.get(key) || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };
      existing.calories += m.calories;
      existing.protein += m.protein;
      existing.carbs += m.carbs;
      existing.fat += m.fat;
      nutritionMap.set(key, existing);
    }

    const nutritionDaily = Array.from(nutritionMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, agg]) => ({
        date,
        ...agg,
      }));

    // Workouts
    const workouts = await prisma.workoutLog.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: "asc" },
      include: {
        sets: {
          include: {
            exerciseTemplate: true,
          },
        },
      },
    });

    // sessions per day
    const sessionMap = new Map<string, number>();
    for (const w of workouts) {
      const key = w.date.toISOString().slice(0, 10);
      sessionMap.set(key, (sessionMap.get(key) || 0) + 1);
    }

    const workoutSessionsPerDay = Array.from(sessionMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, sessions]) => ({
        date,
        sessions,
      }));

    // volume per muscle group (set count)
    const volumeMap = new Map<string, number>();
    for (const w of workouts) {
      for (const s of w.sets) {
        const mg = s.exerciseTemplate.muscleGroup || "Unknown";
        volumeMap.set(mg, (volumeMap.get(mg) || 0) + 1);
      }
    }

    const workoutVolumeByMuscleGroup = Array.from(volumeMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([muscleGroup, sets]) => ({
        muscleGroup,
        sets,
      }));

    res.json({
      nutritionDaily,
      macros,
      workoutSessionsPerDay,
      workoutVolumeByMuscleGroup,
    });
  } catch (err) {
    console.error("Stats overview error:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
});
