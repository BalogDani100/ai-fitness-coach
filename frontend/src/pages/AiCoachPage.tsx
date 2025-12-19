import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../app/providers/AuthProvider";
import {
  getAiFeedbacks,
  createWeeklyReview,
} from "../features/ai/api/ai.client";
import type {
  AiFeedback,
  GetAiFeedbacksResponse,
  CreateWeeklyReviewResponse,
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

function getLastWeekRange(): { from: string; to: string } {
  const today = new Date();
  const to = new Date(today);
  const from = new Date(today);
  from.setDate(from.getDate() - 7);

  const toIso = to.toISOString().slice(0, 10);
  const fromIso = from.toISOString().slice(0, 10);
  return { from: fromIso, to: toIso };
}

export const AiCoachPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState<AiFeedback[]>([]);
  const [latest, setLatest] = useState<AiFeedback | null>(null);

  const [fromDate, setFromDate] = useState<string>(
    () => getLastWeekRange().from
  );
  const [toDate, setToDate] = useState<string>(() => getLastWeekRange().to);

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
        const weekly = all.filter((f) => f.feedbackType === "WEEKLY_REVIEW");

        weekly.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setHistory(weekly);
        setLatest(weekly.length > 0 ? weekly[0] : null);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Failed to load AI reviews");
        } else {
          setError("Failed to load AI reviews");
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    if (!fromDate || !toDate) {
      setError("Please select both start and end date for the review.");
      return;
    }

    const fromTime = new Date(fromDate).getTime();
    const toTime = new Date(toDate).getTime();
    if (Number.isNaN(fromTime) || Number.isNaN(toTime) || fromTime > toTime) {
      setError("Invalid date range. Start date must be before end date.");
      return;
    }

    setError(null);
    setGenerating(true);

    try {
      const res: CreateWeeklyReviewResponse = await createWeeklyReview(token, {
        from: fromDate,
        to: toDate,
      });

      if (!res.feedback) {
        throw new Error("AI review response did not contain feedback.");
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
        setError(err.message || "Failed to generate weekly AI review");
      } else {
        setError("Failed to generate weekly AI review");
      }
    } finally {
      setGenerating(false);
    }
  };

  const weeklyCount = history.length;

  const latestRangeLabel = !latest
    ? "No review yet"
    : `${formatDate(latest.dateFrom)} → ${formatDate(latest.dateTo)}`;

  return (
    <AppLayout>
      <div className="space-y-8">
        {error && (
          <div className="card border-red-500/60 bg-red-950/60 text-sm text-red-100">
            <p className="font-semibold">Hiba történt</p>
            <p className="mt-1 text-xs text-red-200">{error}</p>
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="card relative overflow-hidden">
            <div className="pointer-events-none absolute -left-10 top-[-40px] h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="pointer-events-none absolute right-[-40px] bottom-[-40px] h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">
              AI Weekly Coach
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-50 sm:text-4xl">
              Get a weekly review
              <br />
              based on your real data.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-slate-300">
              The AI coach looks at your logged workouts and meals for a given
              week and generates a detailed review with concrete suggestions for
              training, nutrition and recovery.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid gap-3 rounded-2xl bg-slate-950/70 p-4 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
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
              <div className="flex items-end">
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={generating}
                >
                  {generating ? "Generating..." : "Generate AI review"}
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="pill-accent pill">
                {weeklyCount} saved weekly review
                {weeklyCount === 1 ? "" : "s"}
              </span>
              <span className="pill">Uses your real logs only</span>
              <span className="pill">Actionable training & nutrition tips</span>
            </div>
          </div>

          <div className="card">
            <div className="page-section-header">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Latest AI review
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-50">
                  {latest ? latestRangeLabel : "No weekly review yet"}
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
                You don&apos;t have any weekly AI reviews yet. Select a date
                range and generate your first review.
              </div>
            ) : (
              <div className="mt-3 space-y-3 text-sm">
                <div className="rounded-xl bg-slate-950/70 p-3 text-xs text-slate-300">
                  <p className="mb-1 text-[11px] font-semibold text-slate-400">
                    Summary of the week
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

        <section className="card">
          <div className="page-section-header">
            <h3 className="page-section-title">Previous weekly reviews</h3>
            <p className="page-section-subtitle">
              Browse or re-open older AI reviews.
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
              No weekly reviews saved yet.
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {history.map((fb) => {
                const isExpanded = expandedId === fb.id;
                const range = `${formatDate(fb.dateFrom)} → ${formatDate(
                  fb.dateTo
                )}`;

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
                          {range}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Generated at {formatDateTime(fb.createdAt)}
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
