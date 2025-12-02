import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { deleteWorkoutLog, getWorkoutLogs } from "../api";
import type { GetWorkoutLogsResponse, WorkoutLog, WorkoutSet } from "../api";

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
          setError(err.message);
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

  const handleDeleteLog = async (id: number) => {
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
        <h1 className="text-lg font-semibold">Workout Logs</h1>
        <div className="w-24" />
      </header>

      <main className="px-6 py-8 max-w-5xl mx-auto space-y-6">
        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <section>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
            <h2 className="text-base font-semibold">Workout history</h2>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-xs mb-1 text-slate-300">
                  From
                </label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-300">To</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleFilter}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700"
              >
                Filter
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-300">Loading logs…</p>
          ) : logs.length === 0 ? (
            <p className="text-slate-400 text-sm">
              No logs for this period yet.
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(log.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-400">
                        {log.workoutTemplate
                          ? `Template: ${log.workoutTemplate.name}`
                          : "No template"}
                      </p>
                      {log.notes && (
                        <p className="text-xs text-slate-300 mt-1">
                          Notes: {log.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-xs text-slate-500">
                        Logged at: {new Date(log.createdAt).toLocaleString()}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id)}
                        disabled={deletingId === log.id}
                        className="text-[11px] px-3 py-1 rounded-lg bg-red-900/60 border border-red-800 text-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {deletingId === log.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>

                  {log.sets && log.sets.length > 0 ? (
                    <div className="mt-1 border-t border-slate-800 pt-2">
                      <p className="text-xs font-semibold text-slate-300 mb-1">
                        Sets
                      </p>
                      <div className="space-y-2 text-xs">
                        {groupSetsByExercise(log.sets).map((group) => (
                          <div
                            key={`${group.name}-${group.muscleGroup}`}
                            className="space-y-0.5"
                          >
                            <div className="text-slate-300 font-semibold">
                              {group.name}{" "}
                              <span className="text-slate-400">
                                ({group.muscleGroup})
                              </span>
                            </div>
                            {group.items.map((set) => (
                              <div
                                key={set.id}
                                className="flex justify-between"
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
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      No detailed sets logged for this workout.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
