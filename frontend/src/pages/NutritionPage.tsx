import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  getProfileMe,
  getMealEntries,
  createMealEntry,
  deleteMealEntry,
} from "../api";
import type {
  Macros,
  GetMealEntriesResponse,
  MealEntry,
  MealDailyTotal,
  CreateMealEntryRequest,
  ProfileMeResponse,
} from "../api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type NewMealForm = {
  date: string;
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
};

const TODAY_ISO = new Date().toISOString().slice(0, 10);

type GroupedMealsByDate = {
  date: string;
  items: MealEntry[];
};

// segédfüggvény: összecsoportosítja a bejegyzéseket dátum szerint
function groupEntriesByDate(entries: MealEntry[]): GroupedMealsByDate[] {
  const map = new Map<string, GroupedMealsByDate>();

  for (const e of entries) {
    const key = e.date.slice(0, 10);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { date: key, items: [e] });
    } else {
      existing.items.push(e);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// segédfüggvény: mai napi total kinyerése
function getTodayTotal(totals: MealDailyTotal[]): MealDailyTotal | null {
  return totals.find((t) => t.date === TODAY_ISO) || null;
}

export const NutritionPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [profileMacros, setProfileMacros] = useState<Macros | null>(null);
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [totals, setTotals] = useState<MealDailyTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const [form, setForm] = useState<NewMealForm>({
    date: TODAY_ISO,
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;

    let mounted = true;

    (async () => {
      try {
        const [profileRes, mealsRes]: [
          ProfileMeResponse,
          GetMealEntriesResponse
        ] = await Promise.all([getProfileMe(token), getMealEntries(token)]);

        if (!mounted) return;

        setProfileMacros(profileRes.macros);
        setEntries(mealsRes.entries);
        setTotals(mealsRes.totals);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load nutrition data");
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

  const handleFormChange = (field: keyof NewMealForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);

    if (
      !form.date ||
      !form.name.trim() ||
      !form.calories ||
      !form.protein ||
      !form.carbs ||
      !form.fat
    ) {
      setError("All fields are required.");
      return;
    }

    const payload: CreateMealEntryRequest = {
      date: form.date,
      name: form.name.trim(),
      calories: Number(form.calories),
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fat: Number(form.fat),
    };

    if (
      Number.isNaN(payload.calories) ||
      Number.isNaN(payload.protein) ||
      Number.isNaN(payload.carbs) ||
      Number.isNaN(payload.fat)
    ) {
      setError("Calories and macros must be numbers.");
      return;
    }

    setSaving(true);

    try {
      await createMealEntry(token, payload);

      const res = await getMealEntries(
        token,
        from || undefined,
        to || undefined
      );
      setEntries(res.entries);
      setTotals(res.totals);

      // reset form – todays date marad
      setForm({
        date: TODAY_ISO,
        name: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to create meal");
      } else {
        setError("Failed to create meal");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFilter = async () => {
    if (!token) return;
    setError(null);
    setLoading(true);

    try {
      const res = await getMealEntries(
        token,
        from || undefined,
        to || undefined
      );
      setEntries(res.entries);
      setTotals(res.totals);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to filter meals");
      } else {
        setError("Failed to filter meals");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = async (id: number) => {
    if (!token) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this meal entry?"
    );
    if (!confirmed) return;

    setError(null);
    setDeletingId(id);

    try {
      await deleteMealEntry(token, id);

      const res = await getMealEntries(
        token,
        from || undefined,
        to || undefined
      );
      setEntries(res.entries);
      setTotals(res.totals);
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

  const groupedByDate = groupEntriesByDate(entries);
  const todayTotal = getTodayTotal(totals);

  // Chart data: totals időrendben, date → lokális string + calories
  const chartData = totals
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => ({
      date: new Date(t.date).toLocaleDateString(),
      calories: t.calories,
    }));

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
        <h1 className="text-lg font-semibold">Nutrition & Meals</h1>
        <div className="w-24" />
      </header>

      <main className="px-6 py-8 max-w-5xl mx-auto space-y-8">
        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Today summary card */}
        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-semibold mb-2">
              Today&apos;s calories
            </h2>
            {todayTotal ? (
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {todayTotal.calories}{" "}
                  <span className="text-sm font-normal text-slate-400">
                    kcal
                  </span>
                </p>
                {profileMacros && (
                  <p className="text-xs text-slate-400">
                    Target: {profileMacros.targetCalories} kcal
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  Protein: {todayTotal.protein} g
                  {profileMacros && ` / ${profileMacros.proteinGrams} g`}
                  <br />
                  Carbs: {todayTotal.carbs} g
                  {profileMacros && ` / ${profileMacros.carbGrams} g`}
                  <br />
                  Fat: {todayTotal.fat} g
                  {profileMacros && ` / ${profileMacros.fatGrams} g`}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                No meals logged for today yet.
              </p>
            )}
          </div>

          {/* Quick info about macros source */}
          <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-5 text-sm">
            <h2 className="text-sm font-semibold mb-2">How this works</h2>
            <p className="text-xs text-slate-300 mb-1">
              Your daily calorie and macro targets come from your fitness
              profile (age, weight, activity level, goal).
            </p>
            <p className="text-xs text-slate-400">
              Log your meals below – we sum up the calories, protein, carbs and
              fats per day so you can see how close you are to your targets.
            </p>
          </div>
        </section>

        {/* Calories trend chart */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-semibold mb-3">
            Calories trend (last logged days)
          </h2>
          {chartData.length === 0 ? (
            <p className="text-xs text-slate-400">
              No data yet. Add some meals to see your calorie trend over time.
            </p>
          ) : (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickMargin={8}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickMargin={4}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      border: "1px solid #1e293b",
                      borderRadius: "0.75rem",
                      fontSize: "0.75rem",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Add meal form */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-semibold mb-4">Add meal</h2>

          <form onSubmit={handleCreateMeal} className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="block text-xs mb-1 text-slate-300">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleFormChange("date", e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs mb-1 text-slate-300">
                  Meal name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  placeholder="Chicken & rice, protein shake..."
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <label className="block text-xs mb-1 text-slate-300">
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  value={form.calories}
                  onChange={(e) => handleFormChange("calories", e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-300">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={form.protein}
                  onChange={(e) => handleFormChange("protein", e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-300">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  value={form.carbs}
                  onChange={(e) => handleFormChange("carbs", e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-slate-300">
                  Fat (g)
                </label>
                <input
                  type="number"
                  value={form.fat}
                  onChange={(e) => handleFormChange("fat", e.target.value)}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 transition-colors"
              >
                {saving ? "Saving…" : "Save meal"}
              </button>
            </div>
          </form>
        </section>

        {/* Filter + list */}
        <section>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
            <h2 className="text-base font-semibold">Meal history</h2>
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
                onClick={handleFilter}
                className="px-3 py-2 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700"
              >
                Filter
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-300">Loading meals…</p>
          ) : groupedByDate.length === 0 ? (
            <p className="text-slate-400 text-sm">
              No meals for this period yet.
            </p>
          ) : (
            <div className="space-y-3">
              {groupedByDate.map((group) => {
                const total = totals.find((t) => t.date === group.date);
                return (
                  <div
                    key={group.date}
                    className="bg-slate-900/60 border border-slate-800 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(group.date).toLocaleDateString()}
                        </p>
                        {total && (
                          <p className="text-xs text-slate-400">
                            Total: {total.calories} kcal – P {total.protein}g /
                            C {total.carbs}g / F {total.fat}g
                          </p>
                        )}
                      </div>
                    </div>

                    <ul className="mt-2 space-y-1 text-xs">
                      {group.items.map((e) => (
                        <li
                          key={e.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="font-medium text-slate-100">
                              {e.name}
                            </p>
                            <p className="text-slate-400">
                              {e.calories} kcal – P {e.protein}g / C {e.carbs}g
                              / F {e.fat}g
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteMeal(e.id)}
                            disabled={deletingId === e.id}
                            className="text-[11px] px-3 py-1 rounded-lg bg-red-900/60 border border-red-800 text-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {deletingId === e.id ? "Deleting…" : "Delete"}
                          </button>
                        </li>
                      ))}
                    </ul>
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
