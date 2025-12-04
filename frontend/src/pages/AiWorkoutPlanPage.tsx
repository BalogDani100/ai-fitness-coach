import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { createWorkoutPlan, getAiFeedbacks } from "../api";
import type {
  AiFeedback,
  CreateWorkoutPlanResponse,
  GetAiFeedbacksResponse,
} from "../api";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

export const AiWorkoutPlanPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [latest, setLatest] = useState<AiFeedback | null>(null);
  const [history, setHistory] = useState<AiFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [splitType, setSplitType] = useState<string>("Upper/Lower");
  const [experience, setExperience] = useState<string>("intermediate");
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
        const plans = all.filter((f) => f.feedbackType === "WORKOUT_PLAN");

        setHistory(plans);
        setLatest(plans.length > 0 ? plans[0] : null);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Failed to load workout plans");
        } else {
          setError("Failed to load workout plans");
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
      const res: CreateWorkoutPlanResponse = await createWorkoutPlan(token, {
        daysPerWeek,
        splitType,
        experience,
        notes: notes.trim() || undefined,
      });

      const fb = res.feedback;
      setHistory((prev) => [fb, ...prev]);
      setLatest(fb);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to generate workout plan");
      } else {
        setError("Failed to generate workout plan");
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
        <h1 className="text-lg font-semibold">AI Workout Plan</h1>
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
              <h2 className="text-base font-semibold mb-1">Generate plan</h2>
              <p className="text-sm text-slate-300">
                The AI coach will create a weekly workout plan based on your
                profile and the options below.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                It uses your saved fitness profile (goal, weight, activity) to
                adjust volume and recommendations.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 transition-colors"
            >
              {generating ? "Generating…" : "Generate workout plan"}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <label className="block text-xs mb-1 text-slate-300">
                Days per week
              </label>
              <select
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              >
                <option value={3}>3 days</option>
                <option value={4}>4 days</option>
                <option value={5}>5 days</option>
                <option value={6}>6 days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs mb-1 text-slate-300">
                Split type
              </label>
              <select
                value={splitType}
                onChange={(e) => setSplitType(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              >
                <option value="Upper/Lower">Upper / Lower</option>
                <option value="Push/Pull/Legs">Push / Pull / Legs</option>
                <option value="Full body">Full body</option>
                <option value="Bodypart split">
                  Bodypart split (bro split)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs mb-1 text-slate-300">
                Experience
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1 text-slate-300">
              Extra notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="E.g. weak points, joint issues, exercises you hate, equipment limitations..."
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm resize-y"
            />
          </div>
        </section>

        {/* Latest plan */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">
            Latest workout plan
          </h2>

          {loading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : !latest ? (
            <p className="text-slate-400 text-sm">
              No workout plan yet. Generate your first plan above.
            </p>
          ) : (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-slate-400">
                <span>Type: Workout plan</span>
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
            Previous workout plans
          </h2>

          {loading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : historyWithoutLatest.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No older plans yet. Generate multiple plans to see them here.
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
