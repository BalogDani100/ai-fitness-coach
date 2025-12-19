import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/providers/AuthProvider";
import { createMealPlan, getAiFeedbacks } from "../features/ai/api/ai.client";
import type {
  AiFeedback,
  CreateMealPlanResponse,
  GetAiFeedbacksResponse,
} from "../features/ai/api/ai.dto";
import { AppLayout } from "../app/layout/AppLayout";

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

type MealPlanFormState = {
  mealsPerDay: string;
  preferences: string;
  avoid: string;
  notes: string;
};

export const AiMealPlanPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<MealPlanFormState>({
    mealsPerDay: "3",
    preferences: "",
    avoid: "",
    notes: "",
  });

  const [history, setHistory] = useState<AiFeedback[]>([]);
  const [latest, setLatest] = useState<AiFeedback | null>(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
        const mealPlans = all.filter((f) => f.feedbackType === "MEAL_PLAN");

        mealPlans.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setHistory(mealPlans);
        setLatest(mealPlans.length > 0 ? mealPlans[0] : null);
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

  const handleChange = (field: keyof MealPlanFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    const mealsPerDayNum = Number(form.mealsPerDay);

    if (
      Number.isNaN(mealsPerDayNum) ||
      mealsPerDayNum < 1 ||
      mealsPerDayNum > 8
    ) {
      setError("Meals per day must be a number between 1 and 8.");
      return;
    }

    setError(null);
    setGenerating(true);

    try {
      const res: CreateMealPlanResponse = await createMealPlan(token, {
        mealsPerDay: mealsPerDayNum,
        preferences: form.preferences.trim() || undefined,
        avoid: form.avoid.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });

      if (!res.feedback) {
        throw new Error("AI meal plan response did not contain feedback.");
      }

      const newFeedback = res.feedback;
      setLatest(newFeedback);
      setHistory((prev) => {
        const updated = [newFeedback, ...prev];
        updated.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return updated;
      });
      setExpandedId(newFeedback.id);
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

  const mealPlanCount = history.length;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* ERROR */}
        {error && (
          <div className="card border-red-500/60 bg-red-950/60 text-sm text-red-100">
            <p className="font-semibold">Hiba történt</p>
            <p className="mt-1 text-xs text-red-200">{error}</p>
          </div>
        )}

        {/* HERO + FORM + LATEST PLAN */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          {/* Hero + form */}
          <div className="card relative overflow-hidden">
            <div className="pointer-events-none absolute -left-10 top-[-40px] h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="pointer-events-none absolute right-[-40px] bottom-[-40px] h-48 w-48 rounded-full bg-fuchsia-400/10 blur-3xl" />

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">
              AI Meal Plan
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-50 sm:text-4xl">
              Get a full meal plan
              <br />
              matched to your lifestyle.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-slate-300">
              Define how many meals you want, your preferences and things to
              avoid. The AI will generate a complete day of eating with macros
              that fits your goals.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid gap-3 rounded-2xl bg-slate-950/70 p-4 text-sm"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="meals">Meals per day</label>
                  <input
                    id="meals"
                    type="number"
                    min={1}
                    max={8}
                    value={form.mealsPerDay}
                    onChange={(e) =>
                      handleChange("mealsPerDay", e.target.value)
                    }
                  />
                  <p className="text-[11px] text-slate-500">
                    e.g. 3 main meals, or 4–5 if you like more frequent eating.
                  </p>
                </div>

                <div className="space-y-1">
                  <label htmlFor="prefs">Preferences</label>
                  <input
                    id="prefs"
                    type="text"
                    value={form.preferences}
                    onChange={(e) =>
                      handleChange("preferences", e.target.value)
                    }
                    placeholder="high protein, Mediterranean, simple recipes..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="avoid">Foods to avoid (optional)</label>
                <input
                  id="avoid"
                  type="text"
                  value={form.avoid}
                  onChange={(e) => handleChange("avoid", e.target.value)}
                  placeholder="e.g. pork, lactose, gluten, seafood..."
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="e.g. bulk / cut, budget friendly, quick to cook, training time, etc."
                />
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={generating}
                >
                  {generating ? "Generating..." : "Generate meal plan"}
                </button>
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() =>
                    setForm({
                      mealsPerDay: "3",
                      preferences: "",
                      avoid: "",
                      notes: "",
                    })
                  }
                >
                  Reset form
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="pill-accent pill">
                {mealPlanCount} saved meal plan
                {mealPlanCount === 1 ? "" : "s"}
              </span>
              <span className="pill">Macro-friendly meals</span>
              <span className="pill">Based on your preferences</span>
            </div>
          </div>

          {/* Latest plan */}
          <div className="card">
            <div className="page-section-header">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Latest meal plan
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-50">
                  {latest ? "Most recent AI meal plan" : "No meal plan yet"}
                </h2>
              </div>
              {latest && (
                <span className="pill text-[10px]">
                  Generated at {formatDateTime(latest.createdAt)}
                </span>
              )}
            </div>

            {loading ? (
              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div className="h-4 w-1/2 rounded bg-slate-800" />
                <div className="h-4 w-2/3 rounded bg-slate-800" />
                <div className="h-4 w-3/4 rounded bg-slate-800" />
              </div>
            ) : !latest ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-700/80 bg-slate-950/70 px-4 py-6 text-xs text-slate-400">
                You don&apos;t have any AI meal plans yet. Fill in the form on
                the left and generate your first plan.
              </div>
            ) : (
              <div className="mt-3 space-y-3 text-sm">
                <div className="rounded-xl bg-slate-950/70 p-3 text-xs text-slate-300">
                  <p className="mb-1 text-[11px] font-semibold text-slate-400">
                    Plan context
                  </p>
                  <p className="whitespace-pre-wrap">{latest.inputSummary}</p>
                </div>
                <div className="rounded-xl bg-slate-950/90 p-3 text-xs text-slate-100 whitespace-pre-wrap">
                  {latest.resultText}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* HISTORY LIST */}
        <section className="card">
          <div className="page-section-header">
            <h3 className="page-section-title">Previous AI meal plans</h3>
            <p className="page-section-subtitle">
              Re-open older day-of-eating plans or compare ideas.
            </p>
          </div>

          {loading ? (
            <div className="mt-4 space-y-2 text-xs text-slate-400">
              <div className="h-4 w-1/2 rounded bg-slate-800" />
              <div className="h-4 w-2/3 rounded bg-slate-800" />
              <div className="h-4 w-1/3 rounded bg-slate-800" />
            </div>
          ) : history.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-700/80 bg-slate-950/70 px-4 py-6 text-xs text-slate-400">
              No meal plans saved yet.
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {history.map((fb) => {
                const isExpanded = expandedId === fb.id;

                return (
                  <button
                    key={fb.id}
                    type="button"
                    onClick={() =>
                      setExpandedId((prev) => (prev === fb.id ? null : fb.id))
                    }
                    className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 px-3 py-3 text-left text-xs text-slate-300 transition hover:border-violet-500/80 hover:bg-slate-900/80"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-200">
                          {formatDate(fb.createdAt)} – AI meal plan
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Saved at {formatDateTime(fb.createdAt)}
                        </p>
                      </div>
                      <span className="pill text-[10px] text-violet-200">
                        {isExpanded ? "Hide details" : "Show details"}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-[11px] text-slate-300">
                      {fb.inputSummary}
                    </p>

                    {isExpanded && (
                      <div className="mt-3 border-t border-slate-800 pt-3 text-xs text-slate-50 whitespace-pre-wrap">
                        {fb.resultText}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};
