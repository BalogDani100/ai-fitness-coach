import { Router } from "express";
import { prisma } from "../prisma";
import { authGuard, AuthRequest } from "../middlewares/auth.middleware";

export const profileRouter = Router();

profileRouter.get("/me", authGuard, async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const profile = await prisma.fitnessProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return res.json({ profile: null, macros: null });
  }

  const macros = calculateMacros({
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    age: profile.age,
    gender: profile.gender,
    activityLevel: profile.activityLevel,
    goalType: profile.goalType,
  });

  return res.json({ profile, macros });
});

profileRouter.post("/upsert", authGuard, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const {
    gender,
    age,
    heightCm,
    weightKg,
    activityLevel,
    goalType,
    trainingDays,
  } = req.body;

  if (
    !gender ||
    !age ||
    !heightCm ||
    !weightKg ||
    !activityLevel ||
    !goalType ||
    !trainingDays
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const profile = await prisma.fitnessProfile.upsert({
    where: { userId },
    create: {
      userId,
      gender,
      age,
      heightCm,
      weightKg,
      activityLevel,
      goalType,
      trainingDays,
    },
    update: {
      gender,
      age,
      heightCm,
      weightKg,
      activityLevel,
      goalType,
      trainingDays,
    },
  });

  const macros = calculateMacros({
    weightKg,
    heightCm,
    age,
    gender,
    activityLevel,
    goalType,
  });

  return res.json({ profile, macros });
});

function calculateMacros({
  weightKg,
  heightCm,
  age,
  gender,
  activityLevel,
  goalType,
}: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: string;
  activityLevel: string;
  goalType: string;
}) {
  const s = gender === "female" ? -161 : 5;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + s;

  const activityFactor =
    activityLevel === "high"
      ? 1.725
      : activityLevel === "moderate"
      ? 1.55
      : activityLevel === "light"
      ? 1.375
      : 1.2;

  const tdee = Math.round(bmr * activityFactor);

  let targetCalories = tdee;
  if (goalType === "LOSE_FAT") {
    targetCalories = tdee - 400;
  } else if (goalType === "GAIN_MUSCLE") {
    targetCalories = tdee + 200;
  }

  const proteinGrams = Math.round(weightKg * 2);
  const fatGrams = Math.round(weightKg * 0.8);
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
