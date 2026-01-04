import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProfileMe } from "../features/profile/api/profile.client";
import { getMealEntries } from "../features/nutrition/api/nutrition.client";
import type {
  Macros,
  ProfileMeResponse,
} from "../features/profile/api/profile.dto";
import type {
  GetMealEntriesResponse,
  MealDailyTotal,
} from "../features/nutrition/api/nutrition.dto";
import { useAuth } from "../app/providers/AuthProvider";
import { AppLayout } from "../app/layout/AppLayout";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

function getPercent(current: number, target: number | null | undefined) {
  if (!target || target <= 0) return 0;
  const ratio = (current / target) * 100;
  return Math.round(ratio);
}

export const DashboardPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [macros, setMacros] = useState<Macros | null>(null);
  const [todayTotal, setTodayTotal] = useState<MealDailyTotal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let mounted = true;

    const load = async () => {
      try {
        setError(null);
        setLoading(true);

        const [profileRes, mealsRes]: [
          ProfileMeResponse,
          GetMealEntriesResponse
        ] = await Promise.all([
          getProfileMe(token),
          getMealEntries(token, TODAY_ISO, TODAY_ISO),
        ]);

        if (!mounted) return;

        setMacros(profileRes.macros);

        const todayTotals =
          mealsRes.totals.find((t) => t.date.slice(0, 10) === TODAY_ISO) ??
          null;
        setTodayTotal(todayTotals);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Failed to load dashboard data");
        } else {
          setError("Failed to load dashboard data");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [token]);

  if (!token) {
    navigate("/login");
    return null;
  }

  const targetCaloriesText = macros
    ? `${macros.targetCalories} kcal`
    : "Set up your profile";

  const caloriesPercent =
    todayTotal && macros
      ? getPercent(todayTotal.calories, macros.targetCalories)
      : 0;

  const proteinPercent =
    todayTotal && macros
      ? getPercent(todayTotal.protein, macros.proteinGrams)
      : 0;

  const carbsPercent =
    todayTotal && macros ? getPercent(todayTotal.carbs, macros.carbGrams) : 0;

  const fatPercent =
    todayTotal && macros ? getPercent(todayTotal.fat, macros.fatGrams) : 0;

  const caloriesToday = todayTotal?.calories ?? 0;
  const proteinToday = todayTotal?.protein ?? 0;
  const carbsToday = todayTotal?.carbs ?? 0;
  const fatToday = todayTotal?.fat ?? 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <section className="card animate-pulse">
            <div className="h-4 w-40 rounded bg-slate-800" />
            <div className="mt-4 h-7 w-64 rounded bg-slate-800" />
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="h-10 w-32 rounded-xl bg-slate-800" />
              <div className="h-10 w-32 rounded-xl bg-slate-800" />
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="card h-32 animate-pulse" />
            <div className="card h-32 animate-pulse" />
            <div className="card h-32 animate-pulse" />
          </section>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {error && (
          <div className="card border-red-500/60 bg-red-950/60 text-sm text-red-100">
            <p className="font-semibold">Hiba történt</p>
            <p className="mt-1 text-xs text-red-200">{error}</p>
          </div>
        )}

        <section className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="card relative overflow-hidden">
            <div className="pointer-events-none absolute -left-10 top-[-40px] h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="pointer-events-none absolute right-[-40px] bottom-[-40px] h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">
              Your AI Fitness Coach
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-50 sm:text-4xl">
              Automated calorie tracking,
              <br />
              personalized workouts,
              <br />
              custom meal plans.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-slate-300">
              Let the AI coach handle macros, workout programming and meal
              planning so you can focus on lifting and living. All tailored to{" "}
              {user ? "you." : "your goals."}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!macros && (
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="btn-primary"
                >
                  Set up your profile
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate("/ai-coach")}
                className="btn-secondary"
              >
                Open AI weekly coach
              </button>

              <button
                type="button"
                onClick={() => navigate("/ai/workout-plan")}
                className="btn-secondary"
              >
                Generate AI workout
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="pill-accent pill">
                Tracks nutrition & workouts
              </span>
              <span className="pill">AI feedback from your logs</span>
              <span className="pill">All-in-one fitness dashboard</span>
            </div>
          </div>

          <div className="card flex flex-col justify-between">
            <div className="page-section-header mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Today&apos;s overview
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-50">
                  {TODAY_ISO}
                </h2>
              </div>
              {macros && (
                <div className="rounded-xl bg-slate-900/80 px-3 py-2 text-xs">
                  <p className="text-slate-400">Target calories</p>
                  <p className="font-semibold text-slate-50">
                    {macros.targetCalories} kcal
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="card-muted">
                <p className="text-xs font-semibold text-slate-400">
                  Calories today
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-50">
                  {caloriesToday}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    / {targetCaloriesText}
                  </span>
                </p>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{ width: `${Math.min(caloriesPercent, 130)}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {caloriesPercent}% of your daily target
                </p>
              </div>

              <div className="card-muted">
                <p className="text-xs font-semibold text-slate-400">
                  Macros today
                </p>
                <div className="mt-2 space-y-2 text-xs">
                  <MacroRow
                    label="Protein"
                    current={proteinToday}
                    target={macros?.proteinGrams ?? 0}
                    percent={proteinPercent}
                    barClass="bg-emerald-400"
                  />
                  <MacroRow
                    label="Carbs"
                    current={carbsToday}
                    target={macros?.carbGrams ?? 0}
                    percent={carbsPercent}
                    barClass="bg-sky-400"
                  />
                  <MacroRow
                    label="Fat"
                    current={fatToday}
                    target={macros?.fatGrams ?? 0}
                    percent={fatPercent}
                    barClass="bg-amber-400"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Link
                to="/nutrition"
                className="pill bg-slate-800/80 text-slate-200"
              >
                Open nutrition diary
              </Link>
              <Link
                to="/workouts/logs"
                className="pill bg-slate-800/80 text-slate-200"
              >
                Log today&apos;s workout
              </Link>
              <Link
                to="/progress"
                className="pill bg-slate-800/80 text-slate-200"
              >
                View progress
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="card">
            <div className="page-section-header">
              <h3 className="page-section-title">Nutrition diary</h3>
              <span className="pill-accent pill text-[10px]">Daily use</span>
            </div>
            <p className="page-section-subtitle">
              Log your meals, see your daily calorie and macro totals, and
              quickly spot where you over- or undereat.
            </p>
            <div className="mt-4 flex justify-between text-xs text-slate-400">
              <span>Track meals</span>
              <span>See daily totals</span>
            </div>
            <button
              type="button"
              className="btn-secondary mt-4 w-full justify-between"
              onClick={() => navigate("/nutrition")}
            >
              Open nutrition diary
              <span className="text-xs text-slate-400">→</span>
            </button>
          </div>

          <div className="card">
            <div className="page-section-header">
              <h3 className="page-section-title">Workout templates</h3>
              <span className="pill text-[10px]">Training</span>
            </div>
            <p className="page-section-subtitle">
              Create push/pull/legs or upper/lower splits, then log your
              sessions against structured templates.
            </p>
            <div className="mt-4 flex justify-between text-xs text-slate-400">
              <span>Save templates</span>
              <span>Track progress</span>
            </div>
            <button
              type="button"
              className="btn-secondary mt-4 w-full justify-between"
              onClick={() => navigate("/workouts/templates")}
            >
              View workout templates
              <span className="text-xs text-slate-400">→</span>
            </button>
          </div>

          <div className="card">
            <div className="page-section-header">
              <h3 className="page-section-title">AI coach & plans</h3>
              <span className="pill-accent pill text-[10px]">AI</span>
            </div>
            <p className="page-section-subtitle">
              Get weekly reviews, workout plans and full meal plans generated by
              AI based on your logs and goals.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-300">
              <li>• AI weekly review from your data</li>
              <li>• AI-generated workout split</li>
              <li>• AI-designed meal plans</li>
            </ul>

            <div className="mt-4 grid gap-2 text-xs">
              <button
                type="button"
                className="btn-secondary w-full justify-between"
                onClick={() => navigate("/ai-coach")}
              >
                Open AI weekly coach <span>→</span>
              </button>
              <button
                type="button"
                className="btn-secondary w-full justify-between"
                onClick={() => navigate("/ai/workout-plan")}
              >
                AI workout plan <span>→</span>
              </button>
              <button
                type="button"
                className="btn-secondary w-full justify-between"
                onClick={() => navigate("/ai/meal-plan")}
              >
                AI meal plan <span>→</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

type MacroRowProps = {
  label: string;
  current: number;
  target: number;
  percent: number;
  barClass: string;
};

const MacroRow = ({
  label,
  current,
  target,
  percent,
  barClass,
}: MacroRowProps) => {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">
          {current}g{" "}
          {target > 0 && (
            <span className="text-slate-500">
              / {target}g ({percent}%)
            </span>
          )}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${Math.min(percent, 130)}%` }}
        />
      </div>
    </div>
  );
};
