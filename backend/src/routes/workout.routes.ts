import { Router } from "express";
import { prisma } from "../prisma";
import { authGuard, AuthRequest } from "../middlewares/auth.middleware";

export const workoutRouter = Router();

// All endpoints require auth
workoutRouter.use(authGuard);

// GET /workouts/templates
workoutRouter.get("/templates", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  try {
    const templates = await prisma.workoutTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        exercises: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    res.json({ templates });
  } catch (err) {
    console.error("Get templates error:", err);
    res.status(500).json({ message: "Failed to load workout templates" });
  }
});

// POST /workouts/templates
workoutRouter.post("/templates", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { name, exercises } = req.body as {
    name?: string;
    exercises?: {
      name?: string;
      muscleGroup?: string;
      sets?: number;
      reps?: number;
      rir?: number;
    }[];
  };

  if (!name || !Array.isArray(exercises) || exercises.length === 0) {
    return res.status(400).json({
      message: "Name and at least one exercise are required",
    });
  }

  const validExercises = exercises.filter(
    (e) =>
      e.name && e.muscleGroup && e.sets && e.reps && typeof e.rir === "number"
  );

  if (validExercises.length === 0) {
    return res.status(400).json({
      message: "At least one valid exercise is required",
    });
  }

  try {
    const template = await prisma.workoutTemplate.create({
      data: {
        userId,
        name,
        exercises: {
          create: validExercises.map((e, index) => ({
            name: e.name!,
            muscleGroup: e.muscleGroup!,
            sets: e.sets!,
            reps: e.reps!,
            rir: e.rir!,
            orderIndex: index,
          })),
        },
      },
      include: {
        exercises: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    res.status(201).json({ template });
  } catch (err) {
    console.error("Create template error:", err);
    res.status(500).json({ message: "Failed to create workout template" });
  }
});

// DELETE /workouts/templates/:id
workoutRouter.delete("/templates/:id", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid template id" });
  }

  try {
    const template = await prisma.workoutTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    const logsCount = await prisma.workoutLog.count({
      where: {
        userId,
        workoutTemplateId: id,
      },
    });

    if (logsCount > 0) {
      return res.status(400).json({
        message:
          "This template has workout logs. You cannot delete it while logs exist.",
      });
    }

    await prisma.$transaction([
      prisma.workoutExerciseTemplate.deleteMany({
        where: { workoutTemplateId: id },
      }),
      prisma.workoutTemplate.delete({
        where: { id },
      }),
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error("Delete template error:", err);
    res.status(500).json({ message: "Failed to delete workout template" });
  }
});

// GET /workouts/logs?from=2025-01-01&to=2025-01-31
workoutRouter.get("/logs", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { from, to } = req.query as { from?: string; to?: string };

  try {
    const logs = await prisma.workoutLog.findMany({
      where: {
        userId,
        ...(from
          ? {
              date: {
                gte: new Date(from),
              },
            }
          : {}),
        ...(to
          ? {
              date: {
                lte: new Date(to),
              },
            }
          : {}),
      },
      orderBy: {
        date: "desc",
      },
      include: {
        workoutTemplate: true,
        sets: {
          include: {
            exerciseTemplate: true,
          },
          orderBy: {
            setIndex: "asc",
          },
        },
      },
    });

    res.json({ logs });
  } catch (err) {
    console.error("Get logs error:", err);
    res.status(500).json({ message: "Failed to load workout logs" });
  }
});

// POST /workouts/logs
workoutRouter.post("/logs", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { date, workoutTemplateId, notes, sets } = req.body as {
    date?: string;
    workoutTemplateId?: number;
    notes?: string;
    sets?: {
      exerciseTemplateId?: number;
      setIndex?: number;
      weightKg?: number;
      reps?: number;
      rir?: number;
    }[];
  };

  if (!date) {
    return res.status(400).json({ message: "Date is required" });
  }

  const validSets = Array.isArray(sets)
    ? sets.filter(
        (s) =>
          s.exerciseTemplateId &&
          typeof s.setIndex === "number" &&
          typeof s.weightKg === "number" &&
          typeof s.reps === "number"
      )
    : [];

  try {
    const log = await prisma.workoutLog.create({
      data: {
        userId,
        date: new Date(date),
        workoutTemplateId: workoutTemplateId ?? null,
        notes: notes ?? null,
        ...(validSets.length > 0
          ? {
              sets: {
                create: validSets.map((s) => ({
                  exerciseTemplateId: s.exerciseTemplateId!,
                  setIndex: s.setIndex!,
                  weightKg: s.weightKg!,
                  reps: s.reps!,
                  rir: s.rir ?? null,
                })),
              },
            }
          : {}),
      },
      include: {
        workoutTemplate: true,
        sets: {
          include: {
            exerciseTemplate: true,
          },
          orderBy: {
            setIndex: "asc",
          },
        },
      },
    });

    res.status(201).json({ log });
  } catch (err) {
    console.error("Create log error:", err);
    res.status(500).json({ message: "Failed to create workout log" });
  }
});

// DELETE /workouts/logs/:id
workoutRouter.delete("/logs/:id", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid log id" });
  }

  try {
    const log = await prisma.workoutLog.findFirst({
      where: { id, userId },
    });

    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }

    await prisma.$transaction([
      prisma.workoutSet.deleteMany({
        where: { workoutLogId: id },
      }),
      prisma.workoutLog.delete({
        where: { id },
      }),
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error("Delete log error:", err);
    res.status(500).json({ message: "Failed to delete workout log" });
  }
});
