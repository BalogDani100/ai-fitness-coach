import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../app/providers/AuthProvider";
import { createWorkoutLog, getWorkoutTemplates } from "../features/workouts/api/workouts.client";
import type {
  GetWorkoutTemplatesResponse,
  WorkoutTemplate,
  WorkoutExerciseTemplate,
  WorkoutSetInput,
} from "../features/workouts/api/workouts.dto";
import { AppLayout } from "../app/layout/AppLayout";

type ExerciseSetInput = {
  weight: string;
  reps: string;
  rir: string;
};

type ExerciseWithSets = {
  exercise: WorkoutExerciseTemplate;
  sets: ExerciseSetInput[];
};

export const WorkoutSessionPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();

  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [exerciseSets, setExerciseSets] = useState<ExerciseWithSets[]>([]);
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const numericId = templateId ? Number(templateId) : NaN;
    if (Number.isNaN(numericId)) {
      setError("Invalid template id.");
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        setError(null);
        setLoading(true);

        const res: GetWorkoutTemplatesResponse = await getWorkoutTemplates(
          token
        );
        if (!mounted) return;

        const found = res.templates.find((tpl) => tpl.id === numericId);
        if (!found) {
          setError("Template not found");
          setLoading(false);
          return;
        }

        setTemplate(found);
        setExerciseSets(
          found.exercises.map((ex) => ({
            exercise: ex,
            sets: Array.from({ length: ex.sets }).map(() => ({
              weight: "",
              reps: "",
              rir: ex.rir.toString(),
            })),
          }))
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Failed to load template");
        } else {
          setError("Failed to load template");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, templateId]);

  if (!token) {
    navigate("/login");
    return null;
  }

  const handleSetChange = (
    exerciseId: number,
    setIndex: number,
    field: keyof ExerciseSetInput,
    value: string
  ) => {
    setExerciseSets((prev) =>
      prev.map((item) =>
        item.exercise.id === exerciseId
          ? {
              ...item,
              sets: item.sets.map((set, index) =>
                index === setIndex ? { ...set, [field]: value } : set
              ),
            }
          : item
      )
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!template || !token) return;

    setError(null);
    setSaving(true);

    try {
      const sets: WorkoutSetInput[] = [];

      exerciseSets.forEach((item) => {
        item.sets.forEach((set, idx) => {
          if (!set.weight && !set.reps) return;
          if (!set.weight || !set.reps) return;

          const weightNum = Number(set.weight);
          const repsNum = Number(set.reps);
          if (Number.isNaN(weightNum) || Number.isNaN(repsNum)) return;

          const rirNum = set.rir ? Number(set.rir) : undefined;

          sets.push({
            exerciseTemplateId: item.exercise.id,
            setIndex: idx + 1,
            weightKg: weightNum,
            reps: repsNum,
            ...(rirNum !== undefined && !Number.isNaN(rirNum)
              ? { rir: rirNum }
              : {}),
          });
        });
      });

      await createWorkoutLog(token, {
        date,
        workoutTemplateId: template.id,
        notes: notes.trim() || null,
        sets,
      });

      navigate("/workouts/logs");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to save workout");
      } else {
        setError("Failed to save workout");
      }
    } finally {
      setSaving(false);
    }
  };

  const totalPlannedSets =
    template?.exercises.reduce((sum, ex) => sum + ex.sets, 0) ?? 0;

  const totalFilledSets = exerciseSets.reduce((sum, item) => {
    return (
      sum +
      item.sets.filter((s) => s.weight.trim() !== "" && s.reps.trim() !== "")
        .length
    );
  }, 0);

  return (
    <AppLayout>
      <div className="space-y-8">
        {error && (
          <div className="card border-red-500/60 bg-red-950/60 text-sm text-red-100">
            <p className="font-semibold">Hiba történt</p>
            <p className="mt-1 text-xs text-red-200">{error}</p>
          </div>
        )}

        <section className="card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Workout session
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">
                {template ? `Workout: ${template.name}` : "Loading workout..."}
              </h1>
              <p className="mt-2 text-xs text-slate-400">
                Log your sets (weight, reps, RIR) for this template. Only fully
                filled sets will be saved, so you can easily skip warmups or
                unfinished sets.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950/70 p-3 text-xs">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Session stats
              </p>
              <p className="mt-1 text-[11px] text-slate-300">
                Planned sets:{" "}
                <span className="font-semibold text-slate-50">
                  {totalPlannedSets}
                </span>
              </p>
              <p className="text-[11px] text-slate-300">
                Filled sets:{" "}
                <span className="font-semibold text-slate-50">
                  {totalFilledSets}
                </span>
              </p>
            </div>
          </div>
        </section>

        {loading && (
          <section className="card">
            <div className="space-y-2 text-xs text-slate-400">
              <div className="h-4 w-1/2 rounded bg-slate-800" />
              <div className="h-4 w-2/3 rounded bg-slate-800" />
              <div className="h-4 w-1/3 rounded bg-slate-800" />
              <p className="mt-2">Loading template…</p>
            </div>
          </section>
        )}

        {!loading && template && (
          <section className="card relative overflow-hidden">
            <div className="pointer-events-none absolute -left-16 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 bottom-[-40px] h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />

            <form
              onSubmit={handleSubmit}
              className="relative space-y-6 text-sm"
            >
              <div className="grid gap-4 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
                <div className="space-y-1">
                  <label
                    htmlFor="date"
                    className="text-xs font-semibold text-slate-400"
                  >
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="notes"
                    className="text-xs font-semibold text-slate-400"
                  >
                    Notes (optional)
                  </label>
                  <input
                    id="notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How did this session feel?"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                You can leave a set empty if you skipped it. Only sets with both
                weight and reps filled will be saved.
              </p>

              <div className="space-y-6">
                {exerciseSets.map((item) => (
                  <div
                    key={item.exercise.id}
                    className="rounded-2xl bg-slate-950/80 p-4 ring-1 ring-slate-800/80"
                  >
                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-50">
                          {item.exercise.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.exercise.muscleGroup}
                        </p>
                      </div>
                      <span className="pill text-[10px]">
                        {item.exercise.sets} set
                        {item.exercise.sets === 1 ? "" : "s"} planned @ RIR{" "}
                        {item.exercise.rir}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {item.sets.map((set, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col gap-2 rounded-xl bg-slate-950/80 p-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">
                              Set {idx + 1}
                            </span>
                          </div>
                          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <input
                              type="number"
                              value={set.weight}
                              onChange={(e) =>
                                handleSetChange(
                                  item.exercise.id,
                                  idx,
                                  "weight",
                                  e.target.value
                                )
                              }
                              placeholder="Weight (kg)"
                              className="w-full sm:w-28"
                            />
                            <input
                              type="number"
                              value={set.reps}
                              onChange={(e) =>
                                handleSetChange(
                                  item.exercise.id,
                                  idx,
                                  "reps",
                                  e.target.value
                                )
                              }
                              placeholder="Reps"
                              className="w-full sm:w-24"
                            />
                            <input
                              type="number"
                              value={set.rir}
                              onChange={(e) =>
                                handleSetChange(
                                  item.exercise.id,
                                  idx,
                                  "rir",
                                  e.target.value
                                )
                              }
                              placeholder="RIR"
                              className="w-full sm:w-20"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-4 text-[11px] sm:flex-row sm:items-center sm:justify-between">
                <p className="text-slate-500">
                  When you save, a workout log will be created from this
                  template and appear in your workout history.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigate("/workouts/logs")}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? "Saving…" : "Save workout"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}
      </div>
    </AppLayout>
  );
};
