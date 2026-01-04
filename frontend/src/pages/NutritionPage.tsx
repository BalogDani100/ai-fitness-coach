import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/providers/AuthProvider";
import { getProfileMe } from "../features/profile/api/profile.client";
import type {
  Macros,
  ProfileMeResponse,
} from "../features/profile/api/profile.dto";
import {
  createMealEntry,
  deleteMealEntry,
  getMealEntries,
} from "../features/nutrition/api/nutrition.client";
import type {
  CreateMealEntryRequest,
  GetMealEntriesResponse,
  MealDailyTotal,
  MealEntry,
} from "../features/nutrition/api/nutrition.dto";
import { AppLayout } from "../app/layout/AppLayout";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

function getPercent(current: number, target: number | null | undefined) {
  if (!target || target <= 0) return 0;
  return Math.round((current / target) * 100);
}

type MealFormState = {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
};

export const NutritionPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<string>(TODAY_ISO);
  const [macros, setMacros] = useState<Macros | null>(null);
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [dailyTotal, setDailyTotal] = useState<MealDailyTotal | null>(null);

  const [form, setForm] = useState<MealFormState>({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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
          getMealEntries(token, selectedDate, selectedDate),
        ]);

        if (!mounted) return;

        setMacros(profileRes.macros);

        const dayTotals =
          mealsRes.totals.find((t) => t.date.slice(0, 10) === selectedDate) ??
          null;
        setDailyTotal(dayTotals);

        const dateEntries = mealsRes.entries.filter(
          (e) => e.date.slice(0, 10) === selectedDate
        );
        setEntries(dateEntries);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Failed to load nutrition data");
        } else {
          setError("Failed to load nutrition data");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [token, selectedDate]);

  if (!token) {
    navigate("/login");
    return null;
  }

  const handleChange = (field: keyof MealFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const calories = Number(form.calories);
    const protein = Number(form.protein);
    const carbs = Number(form.carbs);
    const fat = Number(form.fat);

    if (!form.name.trim()) {
      setError("Meal name is required");
      return;
    }

    if (Number.isNaN(calories) || calories <= 0) {
      setError("Calories must be a positive number");
      return;
    }

    setError(null);
    setSaving(true);

    const payload: CreateMealEntryRequest = {
      date: selectedDate,
      name: form.name.trim(),
      calories,
      protein: Number.isNaN(protein) ? 0 : protein,
      carbs: Number.isNaN(carbs) ? 0 : carbs,
      fat: Number.isNaN(fat) ? 0 : fat,
    };

    try {
      await createMealEntry(token, payload);

      const mealsRes: GetMealEntriesResponse = await getMealEntries(
        token,
        selectedDate,
        selectedDate
      );
      const dayTotals =
        mealsRes.totals.find((t) => t.date.slice(0, 10) === selectedDate) ??
        null;
      setDailyTotal(dayTotals);

      const dateEntries = mealsRes.entries.filter(
        (e) => e.date.slice(0, 10) === selectedDate
      );
      setEntries(dateEntries);

      setForm({
        name: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to create meal entry");
      } else {
        setError("Failed to create meal entry");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    setDeletingId(id);
    setError(null);

    try {
      await deleteMealEntry(token, id);

      const mealsRes: GetMealEntriesResponse = await getMealEntries(
        token,
        selectedDate,
        selectedDate
      );
      const dayTotals =
        mealsRes.totals.find((t) => t.date.slice(0, 10) === selectedDate) ??
        null;
      setDailyTotal(dayTotals);

      const dateEntries = mealsRes.entries.filter(
        (e) => e.date.slice(0, 10) === selectedDate
      );
      setEntries(dateEntries);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to delete meal");
      } else {
        setError("Failed to delete meal");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const caloriesToday = dailyTotal?.calories ?? 0;
  const proteinToday = dailyTotal?.protein ?? 0;
  const carbsToday = dailyTotal?.carbs ?? 0;
  const fatToday = dailyTotal?.fat ?? 0;

  const caloriesPercent = getPercent(
    caloriesToday,
    macros?.targetCalories ?? null
  );
  const proteinPercent = getPercent(proteinToday, macros?.proteinGrams ?? null);
  const carbsPercent = getPercent(carbsToday, macros?.carbGrams ?? null);
  const fatPercent = getPercent(fatToday, macros?.fatGrams ?? null);

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Nutrition diary
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-50">
                Daily calorie & macro tracking
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                Log your meals, see your totals for the day and compare them to
                your target macros.
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 text-xs sm:items-end">
              <label htmlFor="date" className="text-[10px] text-slate-400">
                Selected date
              </label>
              <input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 sm:w-auto"
              />
              {macros ? (
                <p className="text-[11px] text-slate-400">
                  Target:{" "}
                  <span className="font-semibold text-slate-200">
                    {macros.targetCalories} kcal
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="btn-secondary mt-1 text-[11px]"
                >
                  Set up profile for macros
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <SummaryCard
              label="Calories"
              value={`${caloriesToday} kcal`}
              target={
                macros ? `${macros.targetCalories} kcal` : "No target set"
              }
              percent={caloriesPercent}
              barClass="bg-violet-500"
            />
            <SummaryCard
              label="Protein"
              value={`${proteinToday} g`}
              target={macros ? `${macros.proteinGrams} g` : "No target"}
              percent={proteinPercent}
              barClass="bg-emerald-400"
            />
            <SummaryCard
              label="Carbs"
              value={`${carbsToday} g`}
              target={macros ? `${macros.carbGrams} g` : "No target"}
              percent={carbsPercent}
              barClass="bg-sky-400"
            />
            <SummaryCard
              label="Fat"
              value={`${fatToday} g`}
              target={macros ? `${macros.fatGrams} g` : "No target"}
              percent={fatPercent}
              barClass="bg-amber-400"
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="card">
            <div className="page-section-header">
              <h3 className="page-section-title">Meals logged</h3>
              <p className="page-section-subtitle">
                {entries.length === 0
                  ? "No meals logged for this day yet."
                  : `${entries.length} meal${
                      entries.length === 1 ? "" : "s"
                    } logged`}
              </p>
            </div>

            {loading ? (
              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div className="h-4 w-1/2 rounded bg-slate-800" />
                <div className="h-4 w-2/3 rounded bg-slate-800" />
                <div className="h-4 w-1/3 rounded bg-slate-800" />
              </div>
            ) : entries.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-700/80 bg-slate-950/70 px-4 py-6 text-xs text-slate-400">
                Start by adding your first meal for{" "}
                <span className="font-medium text-slate-200">
                  {selectedDate}
                </span>
                .
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Calories</th>
                      <th>Protein</th>
                      <th>Carbs</th>
                      <th>Fat</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.name}</td>
                        <td>{entry.calories} kcal</td>
                        <td>{entry.protein} g</td>
                        <td>{entry.carbs} g</td>
                        <td>{entry.fat} g</td>
                        <td className="text-right">
                          <button
                            type="button"
                            className="btn-secondary px-2 py-1 text-[11px]"
                            onClick={() => handleDelete(entry.id)}
                            disabled={deletingId === entry.id}
                          >
                            {deletingId === entry.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="page-section-header">
              <h3 className="page-section-title">Add meal</h3>
              <p className="page-section-subtitle">
                Quickly log a new meal for{" "}
                <span className="font-semibold text-slate-200">
                  {selectedDate}
                </span>
                .
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
              <div className="space-y-1">
                <label htmlFor="meal-name">Meal name</label>
                <input
                  id="meal-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Chicken and rice"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="calories">Calories (kcal)</label>
                  <input
                    id="calories"
                    type="number"
                    inputMode="decimal"
                    value={form.calories}
                    onChange={(e) => handleChange("calories", e.target.value)}
                    placeholder="e.g. 650"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="protein">Protein (g)</label>
                  <input
                    id="protein"
                    type="number"
                    inputMode="decimal"
                    value={form.protein}
                    onChange={(e) => handleChange("protein", e.target.value)}
                    placeholder="e.g. 45"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="carbs">Carbs (g)</label>
                  <input
                    id="carbs"
                    type="number"
                    inputMode="decimal"
                    value={form.carbs}
                    onChange={(e) => handleChange("carbs", e.target.value)}
                    placeholder="e.g. 70"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="fat">Fat (g)</label>
                  <input
                    id="fat"
                    type="number"
                    inputMode="decimal"
                    value={form.fat}
                    onChange={(e) => handleChange("fat", e.target.value)}
                    placeholder="e.g. 15"
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Add meal"}
                </button>
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() =>
                    setForm({
                      name: "",
                      calories: "",
                      protein: "",
                      carbs: "",
                      fat: "",
                    })
                  }
                >
                  Clear form
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

type SummaryCardProps = {
  label: string;
  value: string;
  target: string;
  percent: number;
  barClass: string;
};

const SummaryCard = ({
  label,
  value,
  target,
  percent,
  barClass,
}: SummaryCardProps) => {
  return (
    <div className="card-muted">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-50">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">
        Target: <span className="text-slate-200">{target}</span>
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${Math.min(percent, 130)}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        {percent}% of target for this day
      </p>
    </div>
  );
};
