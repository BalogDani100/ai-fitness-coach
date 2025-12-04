import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getStatsOverview } from "../api";
import type {
  StatsOverviewResponse,
  NutritionDailyStat,
  WorkoutSessionsPerDayStat,
  WorkoutVolumeStat,
} from "../api";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

function getMaxValue<T>(arr: T[], selector: (item: T) => number): number {
  return arr.reduce((max, item) => {
    const v = selector(item);
    return v > max ? v : max;
  }, 0);
}

export const ProgressPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nutritionDaily, setNutritionDaily] = useState<NutritionDailyStat[]>(
    []
  );
  const [workoutSessionsPerDay, setWorkoutSessionsPerDay] = useState<
    WorkoutSessionsPerDayStat[]
  >([]);
  const [workoutVolumeByMuscleGroup, setWorkoutVolumeByMuscleGroup] = useState<
    WorkoutVolumeStat[]
  >([]);
  const [targetCalories, setTargetCalories] = useState<number | null>(null);

  // 1) Redirect login-ra, ha valamiért mégis token nélkül jutnánk ide
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // 2) Adatok betöltése
  useEffect(() => {
    if (!token) return;

    let mounted = true;

    (async () => {
      try {
        setError(null);
        setLoading(true);

        const res: StatsOverviewResponse = await getStatsOverview(
          token,
          from || undefined,
          to || undefined
        );
        if (!mounted) return;

        setNutritionDaily(res.nutritionDaily || []);
        setWorkoutSessionsPerDay(res.workoutSessionsPerDay || []);
        setWorkoutVolumeByMuscleGroup(res.workoutVolumeByMuscleGroup || []);
        setTargetCalories(res.macros ? res.macros.targetCalories : null);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Failed to load stats");
        } else {
          setError("Failed to load stats");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, from, to]);

  // 3) MAX értékek – ezek MOST már mindig lefutnak, nincs előttük return
  const maxCalories = useMemo(
    () => getMaxValue(nutritionDaily, (n) => n.calories),
    [nutritionDaily]
  );

  const maxSessions = useMemo(
    () => getMaxValue(workoutSessionsPerDay, (w) => w.sessions),
    [workoutSessionsPerDay]
  );

  const maxSets = useMemo(
    () => getMaxValue(workoutVolumeByMuscleGroup, (v) => v.sets),
    [workoutVolumeByMuscleGroup]
  );

  // 4) Apply gomb – valójában most nem kell mást csinálnia, a from/to
  // change-ekre magától újrahívódik a useEffect. Meghagyjuk "dummy"-nak.
  const handleRefresh = async () => {
    // opcionálisan ide tehetsz később extra logikát
  };

  // 5) Ha épp redirectelünk, adjunk valami minimális UI-t
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-300 text-sm">Redirecting to login…</p>
      </div>
    );
  }

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
        <h1 className="text-lg font-semibold">Progress & Stats</h1>
        <div className="w-24" />
      </header>

      <main className="px-6 py-8 max-w-5xl mx-auto space-y-8">
        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Filter */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold mb-1">Date range</h2>
              <p className="text-xs text-slate-400">
                By default, the last 30 days are shown. You can narrow it down
                below.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2 text-xs">
              <div>
                <label className="block mb-1 text-slate-300">From</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-300">To</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5"
                />
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="px-3 py-2 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700"
              >
                Apply
              </button>
            </div>
          </div>
        </section>

        {/* Nutrition chart-ish */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-300">
              Daily calories vs target
            </h2>
            {targetCalories && (
              <p className="text-xs text-slate-400">
                Target:{" "}
                <span className="font-semibold text-emerald-400">
                  {targetCalories} kcal
                </span>
              </p>
            )}
          </div>

          {loading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : nutritionDaily.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No meals logged in this period.
            </p>
          ) : (
            <div className="space-y-2">
              {nutritionDaily.map((day) => {
                const ratio = maxCalories > 0 ? day.calories / maxCalories : 0;
                const targetRatio =
                  targetCalories && maxCalories > 0
                    ? targetCalories / maxCalories
                    : null;

                return (
                  <div key={day.date} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">
                        {formatDate(day.date)}
                      </span>
                      <span className="text-slate-400">
                        {day.calories} kcal
                      </span>
                    </div>
                    <div className="relative h-3 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-emerald-500/80"
                        style={{ width: `${ratio * 100}%` }}
                      />
                      {targetRatio !== null && (
                        <div
                          className="absolute inset-y-0 bg-emerald-300/50"
                          style={{
                            left: `${targetRatio * 100}%`,
                            width: "2px",
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Workout sessions */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">
            Workout frequency
          </h2>
          {loading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : workoutSessionsPerDay.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No workouts logged in this period.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {workoutSessionsPerDay.map((day) => {
                const ratio = maxSessions > 0 ? day.sessions / maxSessions : 0;

                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">
                        {formatDate(day.date)}
                      </span>
                      <span className="text-slate-400">
                        {day.sessions} session
                        {day.sessions !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-sky-500/80"
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Volume by muscle group */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">
            Volume by muscle group (sets)
          </h2>
          {loading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : workoutVolumeByMuscleGroup.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No sets logged in this period.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {workoutVolumeByMuscleGroup.map((v) => {
                const ratio = maxSets > 0 ? v.sets / maxSets : 0;

                return (
                  <div key={v.muscleGroup} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">{v.muscleGroup}</span>
                      <span className="text-slate-400">
                        {v.sets} set{v.sets !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-fuchsia-500/80"
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
