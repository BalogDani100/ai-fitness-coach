import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  createWorkoutTemplate,
  deleteWorkoutTemplate,
  getWorkoutTemplates,
} from "../api";
import type {
  CreateWorkoutTemplateRequestExercise,
  GetWorkoutTemplatesResponse,
  WorkoutTemplate,
} from "../api";

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
          setError(err.message);
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

  const handleSubmit = async (e: React.FormEvent) => {
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

      // prepend new template
      setTemplates((prev) => [res.template, ...prev]);

      // reset form
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="text-sm text-slate-300 hover:text-white"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-lg font-semibold">Workout Templates</h1>
        <div className="w-24" />
      </header>

      <main className="px-6 py-8 max-w-5xl mx-auto space-y-8">
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-semibold mb-4">Create new template</h2>

          {error && (
            <p className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-slate-200">
                Template name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                placeholder="Upper 1, Lower 1, Push, Pull..."
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-300">
                    Exercises
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-md">
                    <span className="font-semibold">RIR (Reps In Reserve)</span>{" "}
                    = how many reps you could still do at the end of the set.
                    For example, if you stop at 10 reps and feel you could do 2
                    more, that&apos;s{" "}
                    <span className="font-semibold">RIR 2</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addExerciseRow}
                  className="text-xs px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700"
                >
                  + Add exercise
                </button>
              </div>

              <div className="space-y-2">
                {exercises.map((ex, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start"
                  >
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) =>
                        handleExerciseChange(index, "name", e.target.value)
                      }
                      placeholder="Exercise name"
                      className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                    />
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
                      placeholder="Muscle group"
                      className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) =>
                        handleExerciseChange(index, "sets", e.target.value)
                      }
                      placeholder="Sets"
                      className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      value={ex.reps}
                      onChange={(e) =>
                        handleExerciseChange(index, "reps", e.target.value)
                      }
                      placeholder="Reps"
                      className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={ex.rir}
                        onChange={(e) =>
                          handleExerciseChange(index, "rir", e.target.value)
                        }
                        placeholder="RIR"
                        className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                        title="Reps In Reserve – how many reps you could still do at the end of the set"
                      />
                      {exercises.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExerciseRow(index)}
                          className="px-2 text-xs rounded-lg bg-red-900/60 border border-red-800 text-red-200"
                        >
                          X
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 transition-colors"
              >
                {saving ? "Saving…" : "Save template"}
              </button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">Your templates</h2>
          {loading ? (
            <p className="text-slate-300">Loading templates…</p>
          ) : templates.length === 0 ? (
            <p className="text-slate-400 text-sm">
              You have no templates yet. Create one above.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold mb-1">{tpl.name}</h3>
                      <p className="text-xs text-slate-500">
                        Created at: {new Date(tpl.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => navigate(`/workouts/session/${tpl.id}`)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold"
                      >
                        Start workout
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        disabled={deletingId === tpl.id}
                        className="text-[11px] px-3 py-1 rounded-lg bg-red-900/60 border border-red-800 text-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {deletingId === tpl.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>

                  <ul className="space-y-1 text-sm mt-2">
                    {tpl.exercises.map((ex) => (
                      <li key={ex.id} className="flex justify-between">
                        <span>
                          {ex.name}{" "}
                          <span className="text-slate-400">
                            ({ex.muscleGroup})
                          </span>
                        </span>
                        <span className="text-slate-300">
                          {ex.sets} x {ex.reps} @ RIR {ex.rir}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
