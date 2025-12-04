import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { createMealPlan, getAiFeedbacks } from "../api";
import type {
  AiFeedback,
  CreateMealPlanResponse,
  GetAiFeedbacksResponse,
} from "../api";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

export const AiMealPlanPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [latest, setLatest] = useState<AiFeedback | null>(null);
  const [history, setHistory] = useState<AiFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mealsPerDay, setMealsPerDay] = useState<number>(3);
  const [preferences, setPreferences] = useState<string>(
    "Chicken, rice, oats, Greek yoghurt"
  );
  const [avoid, setAvoid] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (!token) return;

    let mounted = true;

    (async () => {
      try {
        setError(null);
        setLoading(true);
        const res: GetAiFeedbacksResponse = await getAiFeedbacks(token);
        if (!mounted) return;

        const all = res.feedbacks ?? [];
        const plans = all.filter((f) => f.feedbackType === "MEAL_PLAN");

        setHistory(plans);
        setLatest(plans.length > 0 ? plans[0] : null);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Failed to load meal plans");
        } else {
          setError("Failed to load meal plans");
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

  const handleGenerate = async () => {
    if (!token) return;
    setError(null);
    setGenerating(true);

    try {
      const res: CreateMealPlanResponse = await createMealPlan(token, {
        mealsPerDay,
        preferences: preferences.trim() || undefined,
        avoid: avoid.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      const fb = res.feedback;
      setHistory((prev) => [fb, ...prev]);
      setLatest(fb);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to generate meal plan");
      } else {
        setError("Failed to generate meal plan");
      }
    } finally {
      setGenerating(false);
    }
  };

  const historyWithoutLatest = latest
    ? history.filter((fb) => fb.id !== latest.id)
    : history;

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
        <h1 className="text-lg font-semibold">AI Meal Plan</h1>
        <div className="w-24" />
      </header>

      <main className="px-6 py-8 max-w-5xl mx-auto space-y-8">
        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Form + generate */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold mb-1">
                Generate daily meal plan
              </h2>
              <p className="text-sm text-slate-300">
                The AI will create a one-day example meal plan based on your
                target macros from the profile and your food preferences.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                It uses your fitness profile (goal, weight, activity) to infer
                target calories and macros.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 transition-colors"
            >
              {generating ? "Generating…" : "Generate meal plan"}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <label className="block text-xs mb-1 text-slate-300">
                Meals per day
              </label>
              <select
                value={mealsPerDay}
                onChange={(e) => setMealsPerDay(Number(e.target.value))}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              >
                <option value={2}>2 meals</option>
                <option value={3}>3 meals</option>
                <option value={4}>4 meals</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs mb-1 text-slate-300">
                Foods you like (preferences)
              </label>
              <input
                type="text"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                placeholder="Chicken, rice, oats, Greek yoghurt..."
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <label className="block text-xs mb-1 text-slate-300">
                Foods to avoid
              </label>
              <input
                type="text"
                value={avoid}
                onChange={(e) => setAvoid(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                placeholder="E.g. lactose, pork, gluten..."
              />
            </div>

            <div>
              <label className="block text-xs mb-1 text-slate-300">
                Extra notes (optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
                placeholder="Cheap options, cutting phase, etc."
              />
            </div>
          </div>
        </section>

        {/* Latest plan */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">
            Latest meal plan
          </h2>

          {loading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : !latest ? (
            <p className="text-slate-400 text-sm">
              No meal plan yet. Generate your first plan above.
            </p>
          ) : (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-slate-400">
                <span>Type: Meal plan</span>
                <span>Generated: {formatDate(latest.createdAt)}</span>
              </div>
              <div className="h-px bg-slate-800" />
              <div className="text-sm whitespace-pre-wrap text-slate-100">
                {latest.resultText}
              </div>
            </div>
          )}
        </section>

        {/* History */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">
            Previous meal plans
          </h2>

          {loading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : historyWithoutLatest.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No older meal plans yet. Generate multiple plans to see them here.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {historyWithoutLatest.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs text-slate-300">
                      Generated: {formatDate(fb.createdAt)}
                    </span>
                  </div>
                  <div className="text-xs whitespace-pre-wrap text-slate-100">
                    {fb.resultText}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
