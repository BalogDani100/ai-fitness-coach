import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/providers/AuthProvider";
import {
  createWorkoutTemplate,
  deleteWorkoutTemplate,
  getWorkoutTemplates,
} from "../features/workouts/api/workouts.client";
import type {
  CreateWorkoutTemplateRequestExercise,
  GetWorkoutTemplatesResponse,
  WorkoutTemplate,
} from "../features/workouts/api/workouts.dto";
import { AppLayout } from "../app/layout/AppLayout";

type NewExercise = {
  name: string;
  muscleGroup: string;
  sets: number | "";
  reps: number | "";
  rir: number | "";
};

export const WorkoutTemplatesPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("Upper 1");
  const [exercises, setExercises] = useState<NewExercise[]>([
    { name: "", muscleGroup: "", sets: "", reps: "", rir: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;

    let mounted = true;
    (async () => {
      try {
        const res: GetWorkoutTemplatesResponse = await getWorkoutTemplates(
          token
        );
        if (!mounted) return;
        setTemplates(res.templates);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Failed to load workout templates");
        } else {
          setError("Failed to load workout templates");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  if (!token) {
    navigate("/login");
    return null;
  }

  const handleExerciseChange = (
    index: number,
    field: keyof NewExercise,
    value: string
  ) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === index
          ? {
              ...ex,
              [field]:
                field === "sets" || field === "reps" || field === "rir"
                  ? value === ""
                    ? ""
                    : Number(value)
                  : value,
            }
          : ex
      )
    );
  };

  const addExerciseRow = () => {
    setExercises((prev) => [
      ...prev,
      { name: "", muscleGroup: "", sets: "", reps: "", rir: "" },
    ]);
  };

  const removeExerciseRow = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setSaving(true);

    try {
      const validExercises: CreateWorkoutTemplateRequestExercise[] = exercises
        .filter(
          (ex) =>
            ex.name.trim() &&
            ex.muscleGroup.trim() &&
            ex.sets !== "" &&
            ex.reps !== "" &&
            ex.rir !== ""
        )
        .map((ex) => ({
          name: ex.name.trim(),
          muscleGroup: ex.muscleGroup.trim(),
          sets: Number(ex.sets),
          reps: Number(ex.reps),
          rir: Number(ex.rir),
        }));

      if (!name.trim() || validExercises.length === 0) {
        setError("Name and at least one complete exercise are required.");
        setSaving(false);
        return;
      }

      const res = await createWorkoutTemplate(token, {
        name: name.trim(),
        exercises: validExercises,
      });

      setTemplates((prev) => [res.template, ...prev]);

      setName("Upper 1");
      setExercises([
        { name: "", muscleGroup: "", sets: "", reps: "", rir: "" },
      ]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to create template");
      } else {
        setError("Failed to create template");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!token) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this template?"
    );
    if (!confirmed) return;

    setError(null);
    setDeletingId(id);

    try {
      await deleteWorkoutTemplate(token, id);
      setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to delete template");
      } else {
        setError("Failed to delete template");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const templateCount = templates.length;

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
          <div className="page-section-header">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Workout templates
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">
                Plan your training week
              </h1>
              <p className="mt-2 text-xs text-slate-400">
                Create reusable workout templates for your usual sessions (e.g.
                &quot;Upper 1&quot;, &quot;Legs&quot;). You can then log real
                workouts from these templates.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 text-xs">
              <span className="pill-accent pill">
                {templateCount} active template
                {templateCount === 1 ? "" : "s"}
              </span>
              <span className="pill">Uses RIR for progression</span>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="card relative overflow-hidden">
            <div className="pointer-events-none absolute -left-16 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 bottom-[-40px] h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <h2 className="page-section-title mb-1">Create new template</h2>
            <p className="page-section-subtitle mb-4">
              Define a name and add exercises with sets, reps and RIR. You can
              reuse this structure every time you train.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label htmlFor="template-name">Template name</label>
                <input
                  id="template-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Upper 1, Lower A, Push, Pull..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400">
                    Exercises
                  </p>
                  <button
                    type="button"
                    onClick={addExerciseRow}
                    className="text-[11px] font-semibold text-violet-300 hover:text-violet-200"
                  >
                    + Add exercise
                  </button>
                </div>

                <div className="space-y-2">
                  {exercises.map((ex, index) => (
                    <div
                      key={index}
                      className="rounded-2xl bg-slate-950/80 p-3 ring-1 ring-slate-800/80"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold text-slate-300">
                          Exercise #{index + 1}
                        </p>
                        {exercises.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExerciseRow(index)}
                            className="text-[10px] text-slate-500 hover:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[11px]">Name</label>
                          <input
                            type="text"
                            value={ex.name}
                            onChange={(e) =>
                              handleExerciseChange(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Bench press"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px]">Muscle group</label>
                          <input
                            type="text"
                            value={ex.muscleGroup}
                            onChange={(e) =>
                              handleExerciseChange(
                                index,
                                "muscleGroup",
                                e.target.value
                              )
                            }
                            placeholder="Chest"
                          />
                        </div>
                      </div>

                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <label className="text-[11px]">Sets</label>
                          <input
                            type="number"
                            min={1}
                            value={ex.sets}
                            onChange={(e) =>
                              handleExerciseChange(
                                index,
                                "sets",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px]">Reps</label>
                          <input
                            type="number"
                            min={1}
                            value={ex.reps}
                            onChange={(e) =>
                              handleExerciseChange(
                                index,
                                "reps",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px]">RIR</label>
                          <input
                            type="number"
                            min={0}
                            max={5}
                            value={ex.rir}
                            onChange={(e) =>
                              handleExerciseChange(index, "rir", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
                <p>Only fully filled rows will be saved.</p>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving template…" : "Save template"}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <div className="page-section-header">
              <div>
                <h2 className="page-section-title">Your templates</h2>
                <p className="page-section-subtitle">
                  Start a new workout from a template or delete ones you no
                  longer use.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div className="h-4 w-1/2 rounded bg-slate-800" />
                <div className="h-4 w-2/3 rounded bg-slate-800" />
                <div className="h-4 w-1/3 rounded bg-slate-800" />
              </div>
            ) : templates.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-700/80 bg-slate-950/70 px-4 py-6 text-xs text-slate-400">
                You have no templates yet. Create one on the left to speed up
                logging your sessions.
              </div>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="rounded-2xl bg-slate-950/80 p-4 ring-1 ring-slate-800/80 transition hover:ring-violet-500/70"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-50">
                          {tpl.name}
                        </h3>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Created at {new Date(tpl.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {tpl.exercises.length} exercise
                          {tpl.exercises.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-[11px] text-slate-300">
                      {tpl.exercises.map((ex) => (
                        <div
                          key={ex.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="font-semibold">{ex.name}</p>
                            <p className="text-[10px] text-slate-500">
                              {ex.muscleGroup}
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-300">
                            {ex.sets}×{ex.reps} @ RIR {ex.rir}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/workouts/session/${tpl.id}`)}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        Start workout
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        disabled={deletingId === tpl.id}
                        className="text-[11px] text-red-300 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === tpl.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};
