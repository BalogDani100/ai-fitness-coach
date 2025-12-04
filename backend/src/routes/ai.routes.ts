import { Router } from "express";
import { prisma } from "../prisma";
import { authGuard, AuthRequest } from "../middlewares/auth.middleware";
import {
  generateWeeklyReview,
  generateWorkoutPlan,
  generateMealPlan,
} from "../services/aiCoach.service";

export const aiRouter = Router();

// minden endpoint auth mögött
aiRouter.use(authGuard);

type WeeklyReviewBody = {
  from?: string; // "YYYY-MM-DD" vagy teljes ISO string
  to?: string;
};

type WorkoutPlanBody = {
  daysPerWeek?: number;
  splitType?: string;
  experience?: string;
  notes?: string;
};

type MealPlanBody = {
  mealsPerDay?: number;
  preferences?: string;
  avoid?: string;
  notes?: string;
};

function resolveDateRange(body: WeeklyReviewBody) {
  const today = new Date();
  const end = body.to ? new Date(body.to) : today;
  const start = body.from
    ? new Date(body.from)
    : new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000); // -6 nap

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

// saját macros kalkuláció (ugyanaz a logika, mint a profile.routes-ben)
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
 * POST /ai/weekly-review
 */
aiRouter.post(
  "/weekly-review",
  async (req: AuthRequest, res): Promise<void> => {
    const userId = req.userId!;
    const { start, end } = resolveDateRange(req.body as WeeklyReviewBody);

    try {
      const profile = await prisma.fitnessProfile.findUnique({
        where: { userId },
      });

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
          workoutTemplate: true,
          sets: {
            include: {
              exerciseTemplate: true,
            },
          },
        },
      });

      type DayAgg = {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };

      const dayMap = new Map<string, DayAgg>();

      for (const m of meals) {
        const key = m.date.toISOString().slice(0, 10); // YYYY-MM-DD
        const existing = dayMap.get(key) || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        };
        existing.calories += m.calories;
        existing.protein += m.protein;
        existing.carbs += m.carbs;
        existing.fat += m.fat;
        dayMap.set(key, existing);
      }

      const dailyLines: string[] = [];
      const sortedDays = Array.from(dayMap.entries()).sort((a, b) =>
        a[0].localeCompare(b[0])
      );

      for (const [date, agg] of sortedDays) {
        dailyLines.push(
          `${date}: ${agg.calories} kcal (P ${agg.protein}g, C ${agg.carbs}g, F ${agg.fat}g)`
        );
      }

      const totalWorkouts = workouts.length;

      const muscleVolumeMap = new Map<string, number>();

      for (const w of workouts) {
        for (const s of w.sets) {
          const mg = s.exerciseTemplate.muscleGroup || "Unknown";
          const current = muscleVolumeMap.get(mg) || 0;
          muscleVolumeMap.set(mg, current + 1);
        }
      }

      const muscleLines: string[] = [];
      for (const [mg, count] of muscleVolumeMap.entries()) {
        muscleLines.push(`${mg}: ${count} sets`);
      }

      let macroLine = "No fitness profile set.";
      if (profile) {
        const macros = calculateMacrosForProfile(profile);
        macroLine = `Target (based on profile): ${macros.targetCalories} kcal, Protein ${macros.proteinGrams}g, Fat ${macros.fatGrams}g, Carbs ${macros.carbGrams}g.`;
      }

      const inputSummary = [
        `Date range: ${start.toISOString().slice(0, 10)} to ${end
          .toISOString()
          .slice(0, 10)}`,
        "",
        macroLine,
        "",
        "Daily nutrition (per logged day):",
        dailyLines.length ? dailyLines.join("\n") : "No meals logged.",
        "",
        `Workouts: ${totalWorkouts} sessions in this period.`,
        muscleLines.length
          ? "Sets per muscle group:\n" + muscleLines.join("\n")
          : "No sets logged.",
      ].join("\n");

      const resultText = await generateWeeklyReview(inputSummary);

      const feedback = await prisma.aiFeedback.create({
        data: {
          userId,
          dateFrom: start,
          dateTo: end,
          feedbackType: "WEEKLY_REVIEW",
          inputSummary,
          resultText,
        },
      });

      res.status(201).json({ feedback });
    } catch (err) {
      console.error("Weekly review error:", err);
      res.status(500).json({ message: "Failed to generate weekly review" });
    }
  }
);

/**
 * POST /ai/workout-plan
 */
aiRouter.post("/workout-plan", async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const body = req.body as WorkoutPlanBody;

  const daysPerWeek = body.daysPerWeek ?? 4;
  const splitType = body.splitType ?? "Upper/Lower";
  const experience = body.experience ?? "intermediate";
  const notes = body.notes ?? "";

  try {
    const profile = await prisma.fitnessProfile.findUnique({
      where: { userId },
    });

    let profileLine = "No fitness profile set.";
    if (profile) {
      const macros = calculateMacrosForProfile(profile);
      profileLine = `Profile: gender=${profile.gender}, age=${profile.age}, height=${profile.heightCm}cm, weight=${profile.weightKg}kg, goal=${profile.goalType}, activity=${profile.activityLevel}. Target: ${macros.targetCalories} kcal, P ${macros.proteinGrams}g, F ${macros.fatGrams}g, C ${macros.carbGrams}g.`;
    }

    const inputSummary = [
      profileLine,
      "",
      `Workout plan request:`,
      `Days per week: ${daysPerWeek}`,
      `Preferred split type: ${splitType}`,
      `Experience level: ${experience}`,
      notes ? `Additional notes: ${notes}` : "",
    ].join("\n");

    const resultText = await generateWorkoutPlan(inputSummary);

    const now = new Date();
    const feedback = await prisma.aiFeedback.create({
      data: {
        userId,
        dateFrom: now,
        dateTo: now,
        feedbackType: "WORKOUT_PLAN",
        inputSummary,
        resultText,
      },
    });

    res.status(201).json({ feedback });
  } catch (err) {
    console.error("Workout plan error:", err);
    res.status(500).json({ message: "Failed to generate workout plan" });
  }
});

/**
 * POST /ai/meal-plan
 */
aiRouter.post("/meal-plan", async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  const body = req.body as MealPlanBody;

  const mealsPerDay = body.mealsPerDay ?? 3;
  const preferences = body.preferences ?? "";
  const avoid = body.avoid ?? "";
  const notes = body.notes ?? "";

  try {
    const profile = await prisma.fitnessProfile.findUnique({
      where: { userId },
    });

    let macroLine = "No fitness profile set.";
    if (profile) {
      const macros = calculateMacrosForProfile(profile);
      macroLine = `Profile: gender=${profile.gender}, age=${profile.age}, height=${profile.heightCm}cm, weight=${profile.weightKg}kg, goal=${profile.goalType}, activity=${profile.activityLevel}. Target: ${macros.targetCalories} kcal, P ${macros.proteinGrams}g, F ${macros.fatGrams}g, C ${macros.carbGrams}g.`;
    }

    const inputSummary = [
      macroLine,
      "",
      `Meal plan request:`,
      `Meals per day: ${mealsPerDay}`,
      preferences ? `Preferences: ${preferences}` : "",
      avoid ? `Avoid: ${avoid}` : "",
      notes ? `Additional notes: ${notes}` : "",
    ].join("\n");

    const resultText = await generateMealPlan(inputSummary);

    const now = new Date();
    const feedback = await prisma.aiFeedback.create({
      data: {
        userId,
        dateFrom: now,
        dateTo: now,
        feedbackType: "MEAL_PLAN",
        inputSummary,
        resultText,
      },
    });

    res.status(201).json({ feedback });
  } catch (err) {
    console.error("Meal plan error:", err);
    res.status(500).json({ message: "Failed to generate meal plan" });
  }
});

/**
 * GET /ai/feedbacks
 * Visszaadja az adott user utolsó 20 AI feedbackjét (legfrissebb elöl).
 */
aiRouter.get("/feedbacks", async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;

  try {
    const feedbacks = await prisma.aiFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.json({ feedbacks });
  } catch (err) {
    console.error("Get AI feedbacks error:", err);
    res.status(500).json({ message: "Failed to load AI feedbacks" });
  }
});
