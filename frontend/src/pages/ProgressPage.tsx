import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/providers/AuthProvider";
import { getStatsOverview } from "../features/progress/api/progress.client";
import type {
  StatsOverviewResponse,
  NutritionDailyStat,
  WorkoutSessionsPerDayStat,
  WorkoutVolumeStat,
} from "../features/progress/api/progress.dto";
import { AppLayout } from "../app/layout/AppLayout";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

function getDefaultRange(): { from: string; to: string } {
  const today = new Date();
  const to = new Date(today);
  const from = new Date(today);
  from.setDate(from.getDate() - 30);

  const toIso = to.toISOString().slice(0, 10);
  const fromIso = from.toISOString().slice(0, 10);
  return { from: fromIso, to: toIso };
}

export const ProgressPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const defaultRange = getDefaultRange();

  const [fromDate, setFromDate] = useState<string>(defaultRange.from);
  const [toDate, setToDate] = useState<string>(defaultRange.to);

  const [stats, setStats] = useState<StatsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let mounted = true;

    (async () => {
      try {
        setError(null);
        setLoading(true);

        const res = await getStatsOverview(
          token,
          fromDate || undefined,
          toDate || undefined
        );
        if (!mounted) return;

        setStats(res);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Failed to load progress stats");
        } else {
          setError("Failed to load progress stats");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, fromDate, toDate]);

  if (!token) {
    navigate("/login");
    return null;
  }

  const nutritionDaily: NutritionDailyStat[] = stats?.nutritionDaily ?? [];
  const workoutSessions: WorkoutSessionsPerDayStat[] =
    stats?.workoutSessionsPerDay ?? [];
  const volumeStats: WorkoutVolumeStat[] =
    stats?.workoutVolumeByMuscleGroup ?? [];

  const macros = stats?.macros ?? null;

  const daysCount = nutritionDaily.length || workoutSessions.length || 0;

  const avgCalories =
    nutritionDaily.length > 0
      ? Math.round(
          nutritionDaily.reduce((sum, d) => sum + d.calories, 0) /
            nutritionDaily.length
        )
      : null;

  const avgProtein =
    nutritionDaily.length > 0
      ? Math.round(
          nutritionDaily.reduce((sum, d) => sum + d.protein, 0) /
            nutritionDaily.length
        )
      : null;

  const totalSessions = workoutSessions.reduce((sum, d) => sum + d.sessions, 0);

  const maxCalories = nutritionDaily.reduce(
    (max, d) => (d.calories > max ? d.calories : max),
    0
  );
  const maxSessions = workoutSessions.reduce(
    (max, d) => (d.sessions > max ? d.sessions : max),
    0
  );
  const maxVolume = volumeStats.reduce(
    (max, v) => (v.sets > max ? v.sets : max),
    0
  );

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
                Progress overview
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">
                Training & nutrition trends
              </h1>
              <p className="mt-2 text-xs text-slate-400">
                See how consistent you&apos;ve been with workouts and nutrition
                over a selected date range. By default the last 30 days are
                shown.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950/70 p-3 text-xs">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Date range
              </p>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <div className="space-y-1">
                  <label htmlFor="from">From</label>
                  <input
                    id="from"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="to">To</label>
                  <input
                    id="to"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="hidden text-[11px] text-slate-500 md:block">
                  <p>
                    Changing the dates automatically refreshes the stats for the
                    new range.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="card-muted">
              <p className="text-xs font-semibold text-slate-400">
                Average calories
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-50">
                {avgCalories !== null ? `${avgCalories} kcal` : "No data"}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {macros
                  ? `Target: ${macros.targetCalories} kcal`
                  : "Set up your macros in your profile to compare."}
              </p>
            </div>

            <div className="card-muted">
              <p className="text-xs font-semibold text-slate-400">
                Average protein
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-50">
                {avgProtein !== null ? `${avgProtein} g` : "No data"}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Protein is usually the most important macro for muscle gain or
                retention.
              </p>
            </div>

            <div className="card-muted">
              <p className="text-xs font-semibold text-slate-400">
                Workout sessions
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-50">
                {totalSessions}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Across {daysCount || "0"} days in this range.
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="page-section-header">
            <div>
              <h2 className="page-section-title">
                Calories & macros over time
              </h2>
              <p className="page-section-subtitle">
                A quick view of how your daily calories fluctuate. Bars are
                relative to your highest calorie day in this range.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 space-y-2 text-xs text-slate-400">
              <div className="h-4 w-1/2 rounded bg-slate-800" />
              <div className="h-4 w-2/3 rounded bg-slate-800" />
              <div className="h-4 w-1/3 rounded bg-slate-800" />
            </div>
          ) : nutritionDaily.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-700/80 bg-slate-950/70 px-4 py-6 text-xs text-slate-400">
              No nutrition data available for this range. Log some meals in your
              nutrition diary.
            </div>
          ) : (
            <div className="mt-3 space-y-2 text-xs">
              {nutritionDaily.map((d) => {
                const ratio =
                  maxCalories > 0 ? Math.min(d.calories / maxCalories, 1) : 0;
                return (
                  <div
                    key={d.date}
                    className="flex items-center gap-3 rounded-xl bg-slate-950/70 px-3 py-2"
                  >
                    <div className="w-24 shrink-0">
                      <p className="text-[11px] text-slate-300">
                        {formatDate(d.date)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {d.calories} kcal
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                      <div className="mt-1 flex gap-2 text-[10px] text-slate-400">
                        <span>Protein: {d.protein} g</span>
                        <span>Carbs: {d.carbs} g</span>
                        <span>Fat: {d.fat} g</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <div className="page-section-header">
              <div>
                <h2 className="page-section-title">Workout frequency</h2>
                <p className="page-section-subtitle">
                  How many sessions you did per day in this range.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div className="h-4 w-1/2 rounded bg-slate-800" />
                <div className="h-4 w-2/3 rounded bg-slate-800" />
                <div className="h-4 w-1/3 rounded bg-slate-800" />
              </div>
            ) : workoutSessions.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-700/80 bg-slate-950/70 px-4 py-6 text-xs text-slate-400">
                No workout sessions logged for this range. Log workouts from
                your templates.
              </div>
            ) : (
              <div className="mt-3 space-y-2 text-xs">
                {workoutSessions.map((d) => {
                  const ratio =
                    maxSessions > 0 ? Math.min(d.sessions / maxSessions, 1) : 0;
                  return (
                    <div
                      key={d.date}
                      className="flex items-center gap-3 rounded-xl bg-slate-950/70 px-3 py-2"
                    >
                      <div className="w-24 shrink-0">
                        <p className="text-[11px] text-slate-300">
                          {formatDate(d.date)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {d.sessions} session
                          {d.sessions === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="flex-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{ width: `${ratio * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="page-section-header">
              <div>
                <h2 className="page-section-title">Volume by muscle group</h2>
                <p className="page-section-subtitle">
                  Approximated by the number of hard sets per muscle group.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div className="h-4 w-1/2 rounded bg-slate-800" />
                <div className="h-4 w-2/3 rounded bg-slate-800" />
                <div className="h-4 w-1/3 rounded bg-slate-800" />
              </div>
            ) : volumeStats.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-700/80 bg-slate-950/70 px-4 py-6 text-xs text-slate-400">
                No volume data available yet. Log workouts with exercises to see
                volume by muscle group.
              </div>
            ) : (
              <div className="mt-3 space-y-2 text-xs">
                {volumeStats.map((v) => {
                  const ratio =
                    maxVolume > 0 ? Math.min(v.sets / maxVolume, 1) : 0;
                  return (
                    <div
                      key={v.muscleGroup}
                      className="flex items-center gap-3 rounded-xl bg-slate-950/70 px-3 py-2"
                    >
                      <div className="w-32 shrink-0">
                        <p className="text-[11px] text-slate-300">
                          {v.muscleGroup}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {v.sets} sets
                        </p>
                      </div>
                      <div className="flex-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-sky-400"
                            style={{ width: `${ratio * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};
