import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/providers/AuthProvider";
import { deleteWorkoutLog, getWorkoutLogs } from "../features/workouts/api/workouts.client";
import type { GetWorkoutLogsResponse, WorkoutLog, WorkoutSet } from "../features/workouts/api/workouts.dto";
import { AppLayout } from "../app/layout/AppLayout";

function groupSetsByExercise(sets: WorkoutSet[]) {
  const map = new Map<
    number,
    { name: string; muscleGroup: string; items: WorkoutSet[] }
  >();

  for (const set of sets) {
    const ex = set.exerciseTemplate;
    const existing = map.get(ex.id);
    if (!existing) {
      map.set(ex.id, {
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        items: [set],
      });
    } else {
      existing.items.push(set);
    }
  }

  return Array.from(map.values()).map((group) => ({
    ...group,
    items: group.items.slice().sort((a, b) => a.setIndex - b.setIndex),
  }));
}

export const WorkoutLogsPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;

    let mounted = true;

    (async () => {
      try {
        const res: GetWorkoutLogsResponse = await getWorkoutLogs(token);
        if (!mounted) return;
        setLogs(res.logs);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Failed to load workouts");
        } else {
          setError("Failed to load workouts");
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

  const handleFilter = async () => {
    if (!token) return;

    setError(null);
    setLoading(true);

    try {
      const res = await getWorkoutLogs(
        token,
        from || undefined,
        to || undefined
      );
      setLogs(res.logs);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to filter logs");
      } else {
        setError("Failed to filter logs");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this workout log?"
    );
    if (!confirmed) return;

    setError(null);
    setDeletingId(id);

    try {
      await deleteWorkoutLog(token, id);
      setLogs((prev) => prev.filter((log) => log.id !== id));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to delete log");
      } else {
        setError("Failed to delete log");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const logsCount = logs.length;

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
                Workout logs
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">
                History of your sessions
              </h1>
              <p className="mt-2 text-xs text-slate-400">
                Review past workouts, see what weights and reps you used, and
                how your training volume has evolved over time.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950/70 p-3 text-xs">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Date filter
              </p>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <div className="space-y-1">
                  <label htmlFor="from" className="text-[11px]">
                    From
                  </label>
                  <input
                    id="from"
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="to" className="text-[11px]">
                    To
                  </label>
                  <input
                    id="to"
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFilter}
                  className="btn-secondary mt-2 text-[11px]"
                >
                  Apply
                </button>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Leave empty to see the full history.
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="page-section-header">
            <div>
              <h2 className="page-section-title">Workout history</h2>
              <p className="page-section-subtitle">
                {logsCount === 0
                  ? "No workouts logged for this period."
                  : `Showing ${logsCount} workout${
                      logsCount === 1 ? "" : "s"
                    } in this range.`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 space-y-2 text-xs text-slate-400">
              <div className="h-4 w-1/2 rounded bg-slate-800" />
              <div className="h-4 w-2/3 rounded bg-slate-800" />
              <div className="h-4 w-1/3 rounded bg-slate-800" />
            </div>
          ) : logs.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-700/80 bg-slate-950/70 px-4 py-6 text-xs text-slate-400">
              No logs for this period yet. Start workouts from your templates
              and they will appear here automatically.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl bg-slate-950/80 p-4 ring-1 ring-slate-800/80 transition hover:ring-violet-500/70"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {new Date(log.date).toLocaleDateString()}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-slate-50">
                        {log.workoutTemplate
                          ? log.workoutTemplate.name
                          : "Custom workout"}
                      </h3>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Logged at {new Date(log.createdAt).toLocaleString()}
                      </p>
                      {log.notes && (
                        <p className="mt-2 text-[11px] text-slate-300">
                          Notes:{" "}
                          <span className="text-slate-200">{log.notes}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 text-right">
                      <span className="pill text-[10px]">
                        {log.sets?.length ?? 0} set
                        {log.sets && log.sets.length === 1 ? "" : "s"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(log.id)}
                        disabled={deletingId === log.id}
                        className="text-[11px] text-red-300 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === log.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>

                  {log.sets && log.sets.length > 0 ? (
                    <div className="mt-3 border-t border-slate-800 pt-2">
                      <p className="mb-2 text-xs font-semibold text-slate-300">
                        Sets
                      </p>
                      <div className="space-y-2 text-xs">
                        {groupSetsByExercise(log.sets).map((group) => (
                          <div
                            key={`${group.name}-${group.muscleGroup}`}
                            className="space-y-1 rounded-xl bg-slate-950/80 p-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-slate-200 font-semibold">
                                {group.name}{" "}
                                <span className="text-slate-400 text-[11px]">
                                  ({group.muscleGroup})
                                </span>
                              </div>
                            </div>
                            <div className="mt-1 space-y-0.5">
                              {group.items.map((set) => (
                                <div
                                  key={set.id}
                                  className="flex items-center justify-between text-[11px]"
                                >
                                  <span className="text-slate-400">
                                    Set {set.setIndex}:
                                  </span>
                                  <span className="text-slate-100">
                                    {set.weightKg} kg × {set.reps} reps
                                    {set.rir !== null && (
                                      <span className="text-slate-400">
                                        {" "}
                                        (RIR {set.rir})
                                      </span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-slate-500">
                      No detailed sets logged for this workout.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};
