import { Router } from "express";
import { prisma } from "../prisma";
import { authGuard, AuthRequest } from "../middlewares/auth.middleware";

export const nutritionRouter = Router();

nutritionRouter.use(authGuard);

nutritionRouter.get("/entries", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { from, to } = req.query as { from?: string; to?: string };

  try {
    const dateFilter: { gte?: Date; lte?: Date } = {};

    if (from) {
      dateFilter.gte = new Date(from);
    }

    if (to) {
      dateFilter.lte = new Date(to);
    }

    const entries = await prisma.mealEntry.findMany({
      where: {
        userId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      orderBy: { date: "asc" },
    });

    const dailyMap = entries.reduce<
      Record<
        string,
        {
          date: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
        }
      >
    >((acc, e) => {
      const key = e.date.toISOString().slice(0, 10);
      if (!acc[key]) {
        acc[key] = {
          date: key,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        };
      }
      acc[key].calories += e.calories;
      acc[key].protein += e.protein;
      acc[key].carbs += e.carbs;
      acc[key].fat += e.fat;
      return acc;
    }, {});

    const totals = Object.values(dailyMap);

    return res.json({ entries, totals });
  } catch (err) {
    console.error("Get meal entries error:", err);
    return res.status(500).json({ message: "Failed to load meal entries" });
  }
});

nutritionRouter.post("/entries", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { date, name, calories, protein, carbs, fat } = req.body as {
    date?: string;
    name?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };

  if (!date || !name) {
    return res.status(400).json({ message: "Date and name are required" });
  }

  if (
    calories === undefined ||
    protein === undefined ||
    carbs === undefined ||
    fat === undefined
  ) {
    return res.status(400).json({
      message: "Calories and all macros are required",
    });
  }

  try {
    const entry = await prisma.mealEntry.create({
      data: {
        userId,
        date: new Date(date),
        name: name.trim(),
        calories,
        protein,
        carbs,
        fat,
      },
    });

    return res.status(201).json({ entry });
  } catch (err) {
    console.error("Create meal entry error:", err);
    return res.status(500).json({ message: "Failed to create meal entry" });
  }
});

nutritionRouter.delete("/entries/:id", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid entry id" });
  }

  try {
    const existing = await prisma.mealEntry.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ message: "Entry not found" });
    }

    await prisma.mealEntry.delete({ where: { id } });

    return res.json({ success: true });
  } catch (err) {
    console.error("Delete meal entry error:", err);
    return res.status(500).json({ message: "Failed to delete meal entry" });
  }
});
