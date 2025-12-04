import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getAiFeedbacks, createWeeklyReview } from "../api";
import type {
  AiFeedback,
  GetAiFeedbacksResponse,
  CreateWeeklyReviewResponse,
} from "../api";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

function formatRange(from: string, to: string) {
  const start = new Date(from);
  const end = new Date(to);

  const startStr = start.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const endStr = end.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return `${startStr} – ${endStr}`;
}

export const AiCoachPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [latest, setLatest] = useState<AiFeedback | null>(null);
  const [history, setHistory] = useState<AiFeedback[]>([]);
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

        const list = res.feedbacks ?? [];
        setHistory(list);
        setLatest(list.length > 0 ? list[0] : null);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "Failed to load AI feedbacks");
        } else {
          setError("Failed to load AI feedbacks");
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
      const res: CreateWeeklyReviewResponse = await createWeeklyReview(token);
      const fb = res.feedback;

      // legfrissebb megy a lista tetejére
      setHistory((prev) => [fb, ...prev]);
      setLatest(fb);
      setExpandedId(null); // új generálásnál csukjuk össze a history-t
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to generate weekly review");
      } else {
        setError("Failed to generate weekly review");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // History-ból kiszűrjük az aktuális latest-et, hogy ne duplikálódjon
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
        <h1 className="text-lg font-semibold">Weekly AI analysis</h1>
        <div className="w-24" />
      </header>

      <main className="px-6 py-8 max-w-5xl mx-auto space-y-8">
        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Top card: leírás + generate gomb */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold mb-1">Weekly AI analysis</h2>
            <p className="text-sm text-slate-300">
              The AI coach looks at your last 7 days of workouts and nutrition
              and gives you a short review plus concrete action points for next
              week.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Uses your logged meals and workouts from the last 7 days.
              Make sure you have some data there for best results.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 transition-colors"
          >
            {generating ? "Generating…" : "Generate weekly review"}
          </button>
        </section>

        {/* Latest feedback külön kártyán */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">
            Latest feedback
          </h2>

          {loading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : !latest ? (
            <p className="text-slate-400 text-sm">
              No AI feedback yet. Generate your first weekly review above.
            </p>
          ) : (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-slate-400">
                <span>
                  Period: {formatRange(latest.dateFrom, latest.dateTo)}
                </span>
                <span>Generated: {formatDate(latest.createdAt)}</span>
              </div>

              <div className="h-px bg-slate-800" />

              <div className="text-sm whitespace-pre-wrap text-slate-100">
                {latest.resultText}
              </div>
            </div>
          )}
        </section>

        {/* History: CSAK régebbi feedbackek, latest nélkül */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">History</h2>

          {loading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : historyWithoutLatest.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No older AI feedbacks yet. Once you&apos;ve generated multiple
              weeks, they&apos;ll appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {historyWithoutLatest.map((fb) => {
                const isExpanded = expandedId === fb.id;

                return (
                  <button
                    key={fb.id}
                    type="button"
                    onClick={() => handleToggleExpand(fb.id)}
                    className="w-full text-left bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-200">
                          {formatRange(fb.dateFrom, fb.dateTo)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatDate(fb.createdAt)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {isExpanded ? "Hide" : "Show"}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 border-t border-slate-800 pt-3 text-xs whitespace-pre-wrap text-slate-100">
                        {fb.resultText}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
